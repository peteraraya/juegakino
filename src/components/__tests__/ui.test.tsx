import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider } from "@tanstack/react-router";
import { afterEach, describe, expect, it } from "vitest";
import { ComparadorPage } from "@/pages/ComparadorPage";
import { Toasts } from "@/components/ui/Toasts";
import { InfoTip } from "@/components/ui/InfoTip";
import { useUiStore } from "@/stores/uiStore";
import { router } from "@/app/router";

afterEach(() => {
  window.localStorage.clear();
  useUiStore.setState({ toasts: [] });
});

describe("ComparadorPage", () => {
  it("muestra un mejor cartón del lote con score", () => {
    render(<ComparadorPage />);
    const heading = screen.getByRole("heading", { name: /Mejor del lote/i });
    expect(heading).toBeInTheDocument();
    // El botón de usar cartón aparece porque hay candidatos (default 200).
    const useBtn = screen.getByRole("button", { name: /Usar este cartón/i });
    expect(useBtn).toBeInTheDocument();
  });

  it("puedes cambiar cantidad de cartones y volver a comparar", async () => {
    const user = userEvent.setup();
    render(<ComparadorPage />);
    const input = screen.getByLabelText(/Cartones a comparar/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "500" } });
    expect(input.value).toBe("500");
    await user.click(screen.getByRole("button", { name: /Volver a comparar/i }));
    await waitFor(() => expect(screen.getByText(/promedio del lote/i)).toBeInTheDocument());
  });

  it("advierte visualmente sobre la equiprobabilidad", () => {
    render(<ComparadorPage />);
    // El párrafo de la cabecera contiene la nota de honestidad.
    expect(screen.getByText(/no aumenta tu probabilidad/i)).toBeInTheDocument();
  });
});

describe("Onboarding", () => {
  // El onboarding vive en Home (/): el router real lo monta ahí.
  const renderOnboarding = () => render(<RouterProvider router={router} />);

  it("se muestra en primera visita (sin localStorage)", async () => {
    window.localStorage.removeItem("juega-kino-onboarding-v1");
    renderOnboarding();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/El Kino en una frase/i)).toBeInTheDocument();
  });

  it("no aparece si ya fue visto", async () => {
    window.localStorage.setItem("juega-kino-onboarding-v1", "1");
    renderOnboarding();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("avanza por los 4 pasos y se cierra", async () => {
    const user = userEvent.setup();
    window.localStorage.removeItem("juega-kino-onboarding-v1");
    renderOnboarding();
    for (const title of ["Todas las combinaciones son iguales", "Simulador y verificador", "Pesos y estilo"]) {
      await user.click(screen.getByRole("button", { name: /Siguiente/i }));
      expect(screen.getByText(title)).toBeInTheDocument();
    }
    await user.click(screen.getByRole("button", { name: /¡Entendido, comienza!/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(window.localStorage.getItem("juega-kino-onboarding-v1")).toBe("1");
  });
});

describe("Toasts", () => {
  it("muestra una notificación y permite cerrarla", async () => {
    const user = userEvent.setup();
    render(<Toasts />);
    act(() => useUiStore.getState().pushToast("Cartón copiado", "success"));
    // El mensaje es texto plano (no un botón) y se anuncia por `role="status"`.
    expect(await screen.findByText("Cartón copiado")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Cerrar notificación: Cartón copiado/i }));
    await waitFor(() => expect(screen.queryByText("Cartón copiado")).not.toBeInTheDocument());
  });
});

describe("InfoTip", () => {
  it("abre y cierra el tooltip", async () => {
    const user = userEvent.setup();
    render(<InfoTip label="Equiprobabilidad">Cada combinación tiene 1/4.457.400.</InfoTip>);
    const btn = screen.getByRole("button", { name: /Ayuda: Equiprobabilidad/i });
    expect(btn).toBeInTheDocument();
    await user.click(btn);
    expect(await screen.findByText(/Cada combinación tiene 1\/4.457.400/)).toBeInTheDocument();
    await user.click(btn);
    await waitFor(() => expect(screen.queryByText(/Cada combinación tiene 1\/4.457.400/)).not.toBeInTheDocument());
  });
});