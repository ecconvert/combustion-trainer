import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import App from "../App.jsx";
import { UIStateProvider } from "../components/UIStateContext.jsx";
import { expect } from "vitest";

expect.extend(toHaveNoViolations);

test("app is accessible", async () => {
  const { container } = render(
    <UIStateProvider>
      <App />
    </UIStateProvider>
  );
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
