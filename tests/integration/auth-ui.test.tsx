import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  describe,
  test,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from 'vitest';
import AuthForm from '../../src/components/Auth/AuthForm';
import { showToast } from '../../src/utils/showToast';

vi.mock('../../src/utils/showToast', () => ({
  showToast: vi.fn(),
}));

describe('AuthForm', () => {
  let fetchMock: Mock;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'abc' }),
    } as Response);
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    fetchMock.mockReset();
    (showToast as Mock).mockReset();
    localStorage.clear();
  });

  test('submits on enter and calls showToast', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(<AuthForm mode="login" onSuccess={onSuccess} />);
    await user.type(screen.getByLabelText(/username/i), 'user');
    await user.type(screen.getByLabelText(/password/i), 'pass{enter}');
    expect(onSuccess).toHaveBeenCalledWith('abc');
    expect(showToast as Mock).toHaveBeenCalledWith('Signed in', 'success');
  });

  test('announces errors', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid' }),
    } as Response);
    const user = userEvent.setup();
    render(<AuthForm mode="login" onSuccess={() => {}} />);
    await user.type(screen.getByLabelText(/username/i), 'u');
    await user.type(screen.getByLabelText(/password/i), 'p{enter}');
    const status = screen.getByRole('status');
    expect(status.textContent).toContain('Invalid');
    expect(showToast as Mock).toHaveBeenCalledWith('Invalid', 'error');
  });
});
