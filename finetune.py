from __future__ import annotations

import argparse
from collections import defaultdict
from dataclasses import dataclass

import torch
from datasets import Dataset, load_dataset
from peft import LoraConfig
from transformers import AutoModelForCausalLM, AutoTokenizer
from trl import SFTConfig, SFTTrainer

SYSTEM_STYLE = (
    "You are MemoraMind, a warm and patient AI companion for elderly people. "
    "Speak simply and kindly. Validate feelings and gently redirect confusion. "
    "Keep responses concise and emotionally supportive."
)


@dataclass
class Args:
    model_name: str
    output_dir: str
    num_train_epochs: float
    learning_rate: float
    batch_size: int
    grad_accum: int
    max_seq_length: int
    limit_train_samples: int


def parse_args() -> Args:
    parser = argparse.ArgumentParser(description="Fine-tune a Mistral model for empathetic companion responses")
    parser.add_argument("--model_name", type=str, default="mistralai/Mistral-7B-Instruct-v0.3")
    parser.add_argument("--output_dir", type=str, default="./artifacts/memoramind-sft")
    parser.add_argument("--num_train_epochs", type=float, default=1.0)
    parser.add_argument("--learning_rate", type=float, default=2e-4)
    parser.add_argument("--batch_size", type=int, default=2)
    parser.add_argument("--grad_accum", type=int, default=8)
    parser.add_argument("--max_seq_length", type=int, default=768)
    parser.add_argument("--limit_train_samples", type=int, default=30000)

    raw = parser.parse_args()
    return Args(
        model_name=raw.model_name,
        output_dir=raw.output_dir,
        num_train_epochs=raw.num_train_epochs,
        learning_rate=raw.learning_rate,
        batch_size=raw.batch_size,
        grad_accum=raw.grad_accum,
        max_seq_length=raw.max_seq_length,
        limit_train_samples=raw.limit_train_samples,
    )


def build_pairs(split_name: str) -> Dataset:
    ds = load_dataset("empathetic_dialogues", split=split_name)
    grouped: dict[int, list[dict]] = defaultdict(list)

    for row in ds:
        grouped[int(row["conv_id"])].append(
            {
                "utterance_idx": int(row["utterance_idx"]),
                "context": str(row.get("context", "")),
                "prompt": str(row.get("prompt", "")),
                "utterance": str(row.get("utterance", "")),
            }
        )

    rows: list[dict[str, str]] = []
    for _, convo in grouped.items():
        convo = sorted(convo, key=lambda item: item["utterance_idx"])
        for i in range(1, len(convo)):
            previous_turn = convo[i - 1]["utterance"].strip()
            current_turn = convo[i]["utterance"].strip()
            if not previous_turn or not current_turn:
                continue

            emotion_context = convo[i]["context"].strip()
            situation = convo[i]["prompt"].strip()
            user_prompt = (
                f"Emotion context: {emotion_context}. Situation: {situation}. "
                f"User says: {previous_turn}"
            )

            text = (
                "<s>[INST] <<SYS>>\n"
                f"{SYSTEM_STYLE}\n"
                "<</SYS>>\n"
                f"{user_prompt} [/INST] {current_turn}</s>"
            )
            rows.append({"text": text})

    return Dataset.from_list(rows)


def maybe_limit(dataset: Dataset, max_rows: int) -> Dataset:
    if max_rows > 0 and len(dataset) > max_rows:
        return dataset.select(range(max_rows))
    return dataset


def main() -> None:
    args = parse_args()

    tokenizer = AutoTokenizer.from_pretrained(args.model_name, use_fast=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        args.model_name,
        torch_dtype=torch.bfloat16 if torch.cuda.is_available() else torch.float32,
        device_map="auto",
    )

    train_dataset = maybe_limit(build_pairs("train"), args.limit_train_samples)
    eval_dataset = maybe_limit(build_pairs("validation"), 2500)

    peft_config = LoraConfig(
        r=16,
        lora_alpha=32,
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=[
            "q_proj",
            "k_proj",
            "v_proj",
            "o_proj",
            "gate_proj",
            "up_proj",
            "down_proj",
        ],
    )

    sft_config = SFTConfig(
        output_dir=args.output_dir,
        num_train_epochs=args.num_train_epochs,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=args.grad_accum,
        learning_rate=args.learning_rate,
        warmup_ratio=0.03,
        lr_scheduler_type="cosine",
        logging_steps=20,
        save_strategy="steps",
        save_steps=200,
        save_total_limit=2,
        evaluation_strategy="steps",
        eval_steps=200,
        bf16=torch.cuda.is_available(),
        fp16=False,
        report_to="none",
        max_seq_length=args.max_seq_length,
        packing=True,
    )

    trainer = SFTTrainer(
        model=model,
        args=sft_config,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        peft_config=peft_config,
        dataset_text_field="text",
        processing_class=tokenizer,
    )

    trainer.train()
    trainer.save_model(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)

    print("Training complete.")
    print(f"Model artifacts saved to: {args.output_dir}")
    print("If using LoRA adapters, merge separately before full-model deployment if needed.")


if __name__ == "__main__":
    main()
