import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import KrishnaAiApp from "./KrishnaAiApp";

class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

describe("KrishnaAiApp UI controls", () => {
  beforeAll(() => {
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined)
    });
    Object.defineProperty(HTMLMediaElement.prototype, "pause", {
      configurable: true,
      value: vi.fn()
    });
  });

  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the rectangular avatar and removes speed controls", () => {
    render(<KrishnaAiApp />);

    expect(screen.getByTestId("avatar-video-container")).toBeInTheDocument();
    expect(screen.getByTestId("avatar-video")).toHaveClass("avatar-video");
    expect(screen.queryByText("0.5x")).not.toBeInTheDocument();
    expect(screen.queryByText("0.75x")).not.toBeInTheDocument();
    expect(screen.queryByText("1x")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("avatar-mute-toggle"));
    expect(screen.getByText("Mute")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("avatar-playback-toggle"));
    expect(screen.getByText("Play Avatar")).toBeInTheDocument();
  });

  it("controls OM and flute audio independently", () => {
    render(<KrishnaAiApp />);

    const omController = screen.getByTestId("om-audio-controller");
    const fluteController = screen.getByTestId("flute-audio-controller");

    expect(within(omController).getByText("Pause")).toBeInTheDocument();
    expect(within(fluteController).getByText("Play")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("om-audio-controller-toggle"));
    fireEvent.click(screen.getByTestId("flute-audio-controller-toggle"));
    fireEvent.change(screen.getByTestId("om-audio-controller-volume"), { target: { value: "0.5" } });
    fireEvent.change(screen.getByTestId("flute-audio-controller-volume"), { target: { value: "0.35" } });

    expect(within(omController).getByText("Play")).toBeInTheDocument();
    expect(within(fluteController).getByText("Pause")).toBeInTheDocument();
    expect(within(omController).getByText("50%")).toBeInTheDocument();
    expect(within(fluteController).getByText("35%")).toBeInTheDocument();
  });

  it("submits feedback and saves profile preferences", () => {
    render(<KrishnaAiApp />);

    const feedbackForm = screen.getByTestId("feedback-form");
    fireEvent.change(within(feedbackForm).getByPlaceholderText("Your name"), { target: { value: "Test User" } });
    fireEvent.change(within(feedbackForm).getByRole("combobox"), { target: { value: "audio" } });
    fireEvent.change(within(feedbackForm).getByPlaceholderText("Tell us what should feel calmer, clearer, or more personal."), {
      target: { value: "The new audio controls feel calm." }
    });
    fireEvent.submit(feedbackForm);

    expect(screen.getByText("Feedback received. Thank you.")).toBeInTheDocument();

    const profileForm = screen.getByTestId("profile-form");
    fireEvent.change(within(profileForm).getByPlaceholderText("Voice, ambience, guidance tone, meditation style..."), {
      target: { value: "Soft voice, OM only, slow pacing." }
    });
    fireEvent.submit(profileForm);

    expect(screen.getByText("Profile saved.")).toBeInTheDocument();
    expect(window.localStorage.getItem("krishna-ai-profile")).toContain("Soft voice, OM only, slow pacing.");
    expect(window.localStorage.getItem("krishna-ai-profile")).not.toContain("@");
  });
});
