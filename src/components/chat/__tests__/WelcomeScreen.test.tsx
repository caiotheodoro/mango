import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WelcomeScreen } from "../WelcomeScreen";

describe("WelcomeScreen", () => {
  it("renders the main heading", () => {
    render(<WelcomeScreen onSuggestionClick={vi.fn()} />);
    
    expect(screen.getByText("Ask anything about Brazilian mangos")).toBeInTheDocument();
  });

  it("renders the subheading", () => {
    render(<WelcomeScreen onSuggestionClick={vi.fn()} />);
    
    expect(screen.getByText(/Varieties, seasons, exports, nutrition/)).toBeInTheDocument();
  });

  it("renders suggested questions as buttons", () => {
    render(<WelcomeScreen onSuggestionClick={vi.fn()} />);
    
    expect(screen.getByText("What are the main mango varieties grown in Brazil?")).toBeInTheDocument();
    expect(screen.getByText("When is mango season in Brazil?")).toBeInTheDocument();
    expect(screen.getByText("How much mango does Brazil export?")).toBeInTheDocument();
    expect(screen.getByText("What are the nutritional benefits of Brazilian mangos?")).toBeInTheDocument();
  });

  it("calls onSuggestionClick when a suggestion is clicked", () => {
    const mockCallback = vi.fn();
    render(<WelcomeScreen onSuggestionClick={mockCallback} />);
    
    const varietiesButton = screen.getByText("What are the main mango varieties grown in Brazil?");
    fireEvent.click(varietiesButton);
    
    expect(mockCallback).toHaveBeenCalledWith(
      "What are the main mango varieties grown in Brazil?"
    );
  });

  it("calls onSuggestionClick with correct text for image request", () => {
    const mockCallback = vi.fn();
    render(<WelcomeScreen onSuggestionClick={mockCallback} />);
    
    const imageButton = screen.getByText("Show me images of typical brazilian mangos");
    fireEvent.click(imageButton);
    
    expect(mockCallback).toHaveBeenCalledWith(
      "Show me images of typical brazilian mangos"
    );
  });
});
