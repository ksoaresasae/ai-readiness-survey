export const SURVEY_VERSION = "v1.0 — June 2026";

export const sections = [
  {
    id: "awareness",
    title: "Familiarity & Exposure",
    description: "These questions help us understand your current relationship with AI tools — no right or wrong answers.",
    questions: [
      {
        id: "a1",
        text: "How would you describe your current use of AI tools in your work? (e.g., ChatGPT, Copilot, Gemini, or similar)",
        type: "scale",
        labels: ["I haven't used any", "I've tried a few times", "I use them occasionally", "I use them regularly", "They're central to how I work"],
      },
      {
        id: "a2",
        text: "Outside of work, how often do you encounter or use AI-powered tools? (e.g., voice assistants, recommendation systems, AI image tools)",
        type: "scale",
        labels: ["Rarely or never", "A few times a month", "A few times a week", "Daily", "Multiple times a day"],
      },
      {
        id: "a3",
        text: "When a colleague mentions using an AI tool to complete a task, your most honest reaction is:",
        type: "choice",
        options: [
          "Curiosity — I want to know more about how they did it",
          "Indifference — it doesn't particularly affect me",
          "Skepticism — I wonder if the output was actually reliable",
          "Interest in trying it myself",
          "Discomfort — I'm not sure that's the right approach",
        ],
      },
      {
        id: "a4",
        text: "How would you rate your current understanding of what AI tools can and cannot do well?",
        type: "scale",
        labels: ["Very limited", "Basic awareness", "Moderate understanding", "Strong understanding", "Deep expertise"],
      },
    ],
  },
  {
    id: "confidence",
    title: "Confidence & Capability",
    description: "These questions focus on how capable and prepared you feel — not how you think you should feel.",
    questions: [
      {
        id: "c1",
        text: "If your role required you to use an AI tool to complete a routine task next week, how prepared would you feel?",
        type: "scale",
        labels: ["Completely unprepared", "Somewhat unprepared", "Neutral / unsure", "Somewhat prepared", "Very prepared"],
      },
      {
        id: "c2",
        text: "When you hear about a new AI tool that might be relevant to your work, your first instinct is to:",
        type: "choice",
        options: [
          "Look into it on my own",
          "Wait to see if others find it useful first",
          "Ask a colleague to show me",
          "Wait for official guidance or training",
          "Assume it probably isn't relevant to my specific work",
        ],
      },
      {
        id: "c3",
        text: "How confident are you in your ability to evaluate whether an AI-generated output is accurate or reliable?",
        type: "scale",
        labels: ["Not at all confident", "Slightly confident", "Somewhat confident", "Confident", "Very confident"],
      },
      {
        id: "c4",
        text: "In the past six months, how many AI-related skills or concepts have you actively tried to learn?",
        type: "choice",
        options: [
          "None — it hasn't been on my radar",
          "None — I've been interested but haven't found the time",
          "A small amount through casual reading or videos",
          "A meaningful amount through self-directed learning",
          "I've completed structured training or coursework",
        ],
      },
      {
        id: "c5",
        text: "If a colleague asked you to explain what a 'language model' is, you would:",
        type: "choice",
        options: [
          "Not know where to start",
          "Give a rough general answer",
          "Explain it clearly in plain terms",
          "Explain it with examples from my own work",
          "Explain both how it works and its limitations",
        ],
      },
    ],
  },
  {
    id: "sentiment",
    title: "Outlook & Sentiment",
    description: "These questions explore how you feel about where AI is headed — in your field, your organization, and your work.",
    questions: [
      {
        id: "s1",
        text: "Overall, how do you feel about the increasing role of AI tools in professional settings?",
        type: "scale",
        labels: ["Very negative", "Somewhat negative", "Neutral / mixed", "Somewhat positive", "Very positive"],
      },
      {
        id: "s2",
        text: "Over the next 2–3 years, how do you expect AI tools to affect the nature of your specific day-to-day work?",
        type: "choice",
        options: [
          "Little to no change in what I actually do",
          "Some tasks will change, but my role will stay similar",
          "My role will change meaningfully, in ways I expect to adapt to",
          "My role will change significantly — and I'm not sure how",
          "I think my work will change in ways that are mostly positive for me",
        ],
      },
      {
        id: "s3",
        text: "When your organization invests in AI tools and training, your reaction is:",
        type: "scale",
        labels: ["Strongly opposed", "Skeptical", "Wait and see", "Supportive", "Strongly supportive"],
      },
      {
        id: "s4",
        text: "How much do you agree with this statement: 'I feel I have enough information to form a clear view of how AI will affect my work.'",
        type: "scale",
        labels: ["Strongly disagree", "Disagree", "Somewhat agree", "Agree", "Strongly agree"],
      },
      {
        id: "s5",
        text: "Thinking about AI tools specifically in your area of work — which phrase best describes your current outlook?",
        type: "choice",
        options: [
          "Largely irrelevant to what I do",
          "Potentially useful, but unproven for my kind of work",
          "A useful addition if used thoughtfully",
          "An important part of staying effective in my role",
          "Something I'm actively trying to get ahead of",
        ],
      },
    ],
  },
  {
    id: "org",
    title: "Organizational Context",
    description: "These questions help us understand how well we're supporting you — not evaluating your performance.",
    questions: [
      {
        id: "o1",
        text: "How well do you feel the organization has communicated its direction and expectations around AI?",
        type: "scale",
        labels: ["Not at all clearly", "Somewhat unclearly", "Neutral / unclear", "Reasonably clearly", "Very clearly"],
      },
      {
        id: "o2",
        text: "What would most increase your comfort or capability with AI tools at work? (Select the one that fits best)",
        type: "choice",
        options: [
          "Hands-on training specific to my role",
          "Clear policies on when and how AI should be used",
          "Time set aside to experiment without pressure",
          "Seeing concrete examples of how peers are using it",
          "Nothing — I feel comfortable already",
        ],
      },
      {
        id: "o3",
        text: "How psychologically safe do you feel to ask 'basic' questions about AI at work?",
        type: "scale",
        labels: ["Very unsafe", "Somewhat unsafe", "Neutral", "Fairly safe", "Very safe"],
      },
      {
        id: "o4",
        text: "Right now, the clearest obstacle to me using AI tools more effectively at work is:",
        type: "choice",
        options: [
          "I don't know which tools are appropriate or approved",
          "I don't have enough time to learn",
          "I'm not sure AI adds value for what I actually do",
          "I'm not comfortable with the accuracy or reliability",
          "There's no real obstacle — I'm already using them",
        ],
      },
    ],
  },
];

export const openEnded = [
  {
    id: "open1",
    text: "In one or two sentences, describe a work task where you think an AI tool could genuinely help — even if you haven't tried it yet.",
  },
  {
    id: "open2",
    text: "Is there anything about AI in the workplace that you wish leadership better understood? (Optional)",
  },
];

export const demographics = [
  {
    id: "d1",
    label: "Department / Team",
    type: "text",
    placeholder: "e.g., Marketing, Member Services…",
  },
  {
    id: "d2",
    label: "Years at the organization",
    type: "choice",
    options: ["Less than 1 year", "1–3 years", "4–7 years", "8–15 years", "15+ years"],
  },
];

export const ALL_QUESTION_IDS = [
  ...sections.flatMap(s => s.questions.map(q => q.id)),
  ...openEnded.map(q => q.id),
  ...demographics.map(d => d.id),
];
