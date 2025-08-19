import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import App from "../App.jsx";
import { UIStateProvider } from "../components/UIStateContext.jsx";

// TODO(theme): Re-enable after adding theme toggle test id or removing dependency on button
describe.skip("theme toggle", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("applies system theme and persists toggle", async () => {
    // simulate system dark preference
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      media: "(prefers-color-scheme: dark)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as any;

    render(
      <UIStateProvider>
        <App />
      </UIStateProvider>
    );
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    const btn = screen.getByTestId("btn-theme-toggle");
    await userEvent.click(btn);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("ct_theme")).toBe("dark");

    // remount
    render(
      <UIStateProvider>
        <App />
      </UIStateProvider>
    );
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
