import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

export const routerFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

export function TestMemoryRouter({
  children,
  future = routerFutureFlags,
  initialEntries = ['/'],
}) {
  return (
    <MemoryRouter initialEntries={initialEntries} future={future}>
      {children}
    </MemoryRouter>
  );
}

export function renderWithRouter(
  ui,
  { initialEntries = ['/'], future = routerFutureFlags, ...renderOptions } = {}
) {
  return render(
    <TestMemoryRouter initialEntries={initialEntries} future={future}>
      {ui}
    </TestMemoryRouter>,
    renderOptions
  );
}
