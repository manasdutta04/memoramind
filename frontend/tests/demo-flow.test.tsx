import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../src/App';

describe('demo quickstart flow', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    localStorage.clear();
  });

  it('loads demo profile and routes to companion screen', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).includes('/api/demo/load')) {
          return new Response(
            JSON.stringify({
              elder_id: 'demo-ramesh',
              profile: {
                elder_id: 'demo-ramesh',
                elder_name: 'Ramesh',
                language: 'English'
              }
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }

        return new Response(null, { status: 404 });
      })
    );

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /try demo/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /hello, ramesh/i })).toBeInTheDocument();
    });

    expect(localStorage.getItem('memoramind.activeElder')).toBe('demo-ramesh');
  });
});
