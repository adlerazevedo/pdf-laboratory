import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomeScreen } from "./HomeScreen";

describe("HomeScreen", () => {
  it("mostra o título e as seções agrupadas", () => {
    render(<HomeScreen onSelectTool={() => {}} />);
    expect(screen.getByText("O que você deseja fazer?")).toBeInTheDocument();
    expect(screen.getByText("Ferramentas principais")).toBeInTheDocument();
    expect(screen.getByText("Segurança e documentos")).toBeInTheDocument();
  });

  it("filtra os cartões pela busca (título e descrição)", () => {
    render(<HomeScreen onSelectTool={() => {}} />);
    const search = screen.getByLabelText("Buscar ferramentas");
    fireEvent.change(search, { target: { value: "marca d" } });
    expect(screen.getByText("Marca d'água")).toBeInTheDocument();
    expect(screen.queryByText("Unir PDFs")).not.toBeInTheDocument();
  });

  it("chama onSelectTool ao clicar em um cartão disponível", () => {
    const onSelectTool = vi.fn();
    render(<HomeScreen onSelectTool={onSelectTool} />);
    fireEvent.click(screen.getByRole("button", { name: "Unir PDFs" }));
    expect(onSelectTool).toHaveBeenCalledWith("merge");
  });

  it("não permite clicar em ferramentas exclusivas do desktop", () => {
    const onSelectTool = vi.fn();
    render(<HomeScreen onSelectTool={onSelectTool} />);
    const button = screen.getByRole("button", { name: "Otimização avançada (Ghostscript)" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onSelectTool).not.toHaveBeenCalled();
  });
});
