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
  
  // Open settings menu
  const settingsBtn = screen.getByLabelText("Settings");
  await userEvent.click(settingsBtn);
  
  // The General section should be selected by default, and the reset layout button should be visible
  const resetBtn = screen.getByTestId("btn-reset-layout");
  await userEvent.click(resetBtn);
  
  expect(localStorage.getItem("ct_layouts_v1")).toBeNull();
});
