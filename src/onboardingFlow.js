// onboardingFlow.js
// A simple helper that loads the onboardingFlow.json file

export async function loadOnboardingFlow() {
  try {
    const response = await fetch("onboardingFlow.json");

    if (!response.ok) {
      throw new Error("Failed to load onboardingFlow.json");
    }

    const flow = await response.json();

    // Return onboarding + preferences as a single array
    const questions = [
      ...flow.onboarding.filter(q => q.isActive),
      ...flow.preferences.filter(q => q.isActive)
    ];

    return questions;
  } catch (err) {
    console.warn("Error loading onboarding flow, using fallback:", err);
    // Fallback questions so the page isn't empty
    return [
      { question: "What is your occupation?", type: "text" },
      { question: "Tell us about yourself", type: "textarea" }
    ];
  }
}