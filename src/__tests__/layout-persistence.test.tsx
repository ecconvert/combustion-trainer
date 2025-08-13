import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App.jsx";
import { UIStateProvider } from "../components/UIStateContext.jsx";

test("reset layout clears storage", async () => {
  localStorage.setItem("ct_layouts_v1", JSON.stringify({}));
  render(
    <UIStateProvider>
      <App />
    </UIStateProvider>
  );
  const btn = screen.getByTestId("btn-reset-layout");
  await userEvent.click(btn);
  expect(localStorage.getItem("ct_layouts_v1")).toBeNull();
});
