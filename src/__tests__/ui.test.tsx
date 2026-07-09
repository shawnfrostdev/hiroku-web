import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";

describe("Button Component", () => {
  it("should render button with children text", () => {
    render(<Button>Click Here</Button>);
    const btn = screen.getByRole("button", { name: /click here/i });
    expect(btn).toBeDefined();
  });

  it("should apply custom class name", () => {
    render(<Button className="custom-class-123">Test</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("custom-class-123");
  });

  it("should apply primary variant classes by default", () => {
    render(<Button>Test</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-[#FFFFFF]");
    expect(btn.className).toContain("text-[#000000]");
  });
});
