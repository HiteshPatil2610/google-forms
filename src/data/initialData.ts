import { Form, FormResponse } from '../types';

export const DEFAULT_THEME_COLORS = [
  { name: 'Purple', primary: '#673ab7', bg: '#f0ebf8' },
  { name: 'Indigo', primary: '#3f51b5', bg: '#e8eaf6' },
  { name: 'Blue', primary: '#1a73e8', bg: '#e8f0fe' },
  { name: 'Teal', primary: '#009688', bg: '#e0f2f1' },
  { name: 'Green', primary: '#2e7d32', bg: '#e8f5e9' },
  { name: 'Orange', primary: '#e65100', bg: '#fff3e0' },
  { name: 'Amber', primary: '#ff6f00', bg: '#fff8e1' },
  { name: 'Red', primary: '#c62828', bg: '#ffebee' },
  { name: 'Rose', primary: '#ad1457', bg: '#fce4ec' },
  { name: 'Slate', primary: '#455a64', bg: '#eceff1' },
];

export const INITIAL_FORMS: Form[] = [
  {
    id: 'form-customer-feedback',
    title: 'Customer Satisfaction & Product Feedback',
    description: 'We value your input! Please take 2 minutes to share your experience with our product and services.',
    category: 'Customer Feedback',
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-08T14:30:00.000Z',
    isFavorite: true,
    theme: {
      primaryColor: '#673ab7',
      backgroundColor: '#f0ebf8',
      headerImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80',
      fontStyle: 'Roboto',
    },
    settings: {
      isQuiz: false,
      releaseGradesImmediately: true,
      allowResponseEditing: true,
      limitOneResponse: false,
      showProgressBar: true,
      shuffleQuestionOrder: false,
      confirmationMessage: 'Thank you for your feedback! Your response has been recorded.',
      acceptingResponses: true,
      closedMessage: 'This form is no longer accepting responses.',
    },
    sections: [
      {
        id: 'sec-1',
        title: 'General Experience',
        description: 'Tell us how you feel about our services.',
      },
      {
        id: 'sec-2',
        title: 'Detailed Product Rating',
        description: 'Rate specific features and provide suggestions.',
      },
    ],
    questions: [
      {
        id: 'q-1',
        sectionId: 'sec-1',
        type: 'RATING',
        title: 'Overall, how satisfied are you with our product?',
        description: '1 star = Very Unsatisfied, 5 stars = Extremely Satisfied',
        required: true,
      },
      {
        id: 'q-2',
        sectionId: 'sec-1',
        type: 'MULTIPLE_CHOICE',
        title: 'How often do you use our platform?',
        required: true,
        options: [
          { id: 'opt-1-1', text: 'Daily' },
          { id: 'opt-1-2', text: 'Weekly' },
          { id: 'opt-1-3', text: 'Monthly' },
          { id: 'opt-1-4', text: 'Rarely / First time' },
        ],
      },
      {
        id: 'q-3',
        sectionId: 'sec-2',
        type: 'CHECKBOXES',
        title: 'Which features do you use most frequently? (Select all that apply)',
        required: false,
        options: [
          { id: 'opt-3-1', text: 'Dashboard Analytics' },
          { id: 'opt-3-2', text: 'Real-time Collaboration' },
          { id: 'opt-3-3', text: 'Automated Workflows' },
          { id: 'opt-3-4', text: 'Mobile App' },
          { id: 'opt-3-5', text: 'Export & Integrations' },
        ],
      },
      {
        id: 'q-4',
        sectionId: 'sec-2',
        type: 'LINEAR_SCALE',
        title: 'How likely are you to recommend us to a colleague or friend?',
        required: true,
        scaleMin: 1,
        scaleMax: 10,
        scaleMinLabel: 'Not likely at all',
        scaleMaxLabel: 'Extremely likely',
      },
      {
        id: 'q-5',
        sectionId: 'sec-2',
        type: 'PARAGRAPH',
        title: 'What is one thing we could do to improve your experience?',
        required: false,
      },
    ],
  },
  {
    id: 'form-python-quiz',
    title: 'Python Essentials & Data Types Quiz',
    description: 'Test your understanding of Python fundamentals, lists, dictionaries, and basic algorithms.',
    category: 'Quiz',
    createdAt: '2026-08-03T09:15:00.000Z',
    updatedAt: '2026-08-09T06:00:00.000Z',
    isFavorite: false,
    theme: {
      primaryColor: '#1a73e8',
      backgroundColor: '#e8f0fe',
      headerImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      fontStyle: 'Roboto',
    },
    settings: {
      isQuiz: true,
      releaseGradesImmediately: true,
      allowResponseEditing: false,
      limitOneResponse: true,
      showProgressBar: true,
      shuffleQuestionOrder: false,
      confirmationMessage: 'Your quiz has been submitted! Your score is calculated automatically.',
      acceptingResponses: true,
      closedMessage: 'This quiz is closed.',
    },
    sections: [
      {
        id: 'sec-quiz-1',
        title: 'Python Basics & Logic',
        description: 'Answer all 4 questions below.',
      },
    ],
    questions: [
      {
        id: 'q-py-1',
        sectionId: 'sec-quiz-1',
        type: 'MULTIPLE_CHOICE',
        title: 'Which keyword is used to define a function in Python?',
        required: true,
        points: 10,
        correctAnswer: 'opt-py1-2',
        explanation: 'In Python, functions are defined using the `def` keyword.',
        options: [
          { id: 'opt-py1-1', text: 'function' },
          { id: 'opt-py1-2', text: 'def' },
          { id: 'opt-py1-3', text: 'func' },
          { id: 'opt-py1-4', text: 'define' },
        ],
      },
      {
        id: 'q-py-2',
        sectionId: 'sec-quiz-1',
        type: 'MULTIPLE_CHOICE',
        title: 'What is the output of `type([])` in Python?',
        required: true,
        points: 10,
        correctAnswer: 'opt-py2-1',
        explanation: 'Square brackets `[]` create a list object in Python.',
        options: [
          { id: 'opt-py2-1', text: '<class \'list\'>' },
          { id: 'opt-py2-2', text: '<class \'array\'>' },
          { id: 'opt-py2-3', text: '<class \'dict\'>' },
          { id: 'opt-py2-4', text: '<class \'tuple\'>' },
        ],
      },
      {
        id: 'q-py-3',
        sectionId: 'sec-quiz-1',
        type: 'CHECKBOXES',
        title: 'Which of the following data structures are MUTABLE in Python? (Select all correct answers)',
        required: true,
        points: 10,
        correctAnswer: ['opt-py3-1', 'opt-py3-2'],
        explanation: 'Lists and Dictionaries are mutable. Tuples and Strings are immutable.',
        options: [
          { id: 'opt-py3-1', text: 'List' },
          { id: 'opt-py3-2', text: 'Dictionary' },
          { id: 'opt-py3-3', text: 'Tuple' },
          { id: 'opt-py3-4', text: 'String' },
        ],
      },
      {
        id: 'q-py-4',
        sectionId: 'sec-quiz-1',
        type: 'SHORT_ANSWER',
        title: 'What is the built-in function to return the length of a list?',
        required: true,
        points: 10,
        correctAnswer: 'len',
        explanation: 'The `len()` function returns the number of items in an object.',
      },
    ],
  },
  {
    id: 'form-event-registration',
    title: 'Tech Summit 2026 Registration',
    description: 'Join us for the flagship tech conference! Please fill out your details and workshop choices.',
    category: 'Event Registration',
    createdAt: '2026-08-05T11:00:00.000Z',
    updatedAt: '2026-08-07T16:20:00.000Z',
    isFavorite: false,
    theme: {
      primaryColor: '#2e7d32',
      backgroundColor: '#e8f5e9',
      headerImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
      fontStyle: 'Roboto',
    },
    settings: {
      isQuiz: false,
      releaseGradesImmediately: true,
      allowResponseEditing: true,
      limitOneResponse: false,
      showProgressBar: true,
      shuffleQuestionOrder: false,
      confirmationMessage: 'Your registration is confirmed! We will send event details to your email.',
      acceptingResponses: true,
      closedMessage: 'Registrations are now closed.',
    },
    sections: [
      {
        id: 'sec-evt-1',
        title: 'Participant Info',
        description: 'Provide contact info for badge printing.',
      },
    ],
    questions: [
      {
        id: 'q-evt-1',
        sectionId: 'sec-evt-1',
        type: 'SHORT_ANSWER',
        title: 'Full Name',
        required: true,
      },
      {
        id: 'q-evt-2',
        sectionId: 'sec-evt-1',
        type: 'SHORT_ANSWER',
        title: 'Work Email Address',
        required: true,
      },
      {
        id: 'q-evt-3',
        sectionId: 'sec-evt-1',
        type: 'DROPDOWN',
        title: 'Attendance Mode',
        required: true,
        options: [
          { id: 'opt-evt3-1', text: 'In-Person (San Francisco HQ)' },
          { id: 'opt-evt3-2', text: 'Virtual / Live Stream' },
          { id: 'opt-evt3-3', text: 'VIP Access Pass' },
        ],
      },
      {
        id: 'q-evt-4',
        sectionId: 'sec-evt-1',
        type: 'CHECKBOXES',
        title: 'Dietary Restrictions (For In-Person Guests)',
        required: false,
        options: [
          { id: 'opt-evt4-1', text: 'Vegetarian' },
          { id: 'opt-evt4-2', text: 'Vegan' },
          { id: 'opt-evt4-3', text: 'Gluten-Free' },
          { id: 'opt-evt4-4', text: 'Halal' },
          { id: 'opt-evt4-5', text: 'None' },
        ],
      },
    ],
  },
];

export const INITIAL_RESPONSES: FormResponse[] = [
  // Responses for Customer Satisfaction
  {
    id: 'resp-cs-1',
    formId: 'form-customer-feedback',
    submittedAt: '2026-08-08T11:12:00.000Z',
    respondentEmail: 'alex.morgan@techcorp.com',
    answers: [
      { questionId: 'q-1', value: 5 },
      { questionId: 'q-2', value: 'opt-1-1' }, // Daily
      { questionId: 'q-3', value: ['opt-3-1', 'opt-3-2', 'opt-3-5'] },
      { questionId: 'q-4', value: 9 },
      { questionId: 'q-5', value: 'Dark mode options could be slightly higher contrast. Otherwise loving the software!' },
    ],
  },
  {
    id: 'resp-cs-2',
    formId: 'form-customer-feedback',
    submittedAt: '2026-08-08T14:22:00.000Z',
    respondentEmail: 'sarah.j@designstudio.io',
    answers: [
      { questionId: 'q-1', value: 4 },
      { questionId: 'q-2', value: 'opt-1-2' }, // Weekly
      { questionId: 'q-3', value: ['opt-3-1', 'opt-3-3'] },
      { questionId: 'q-4', value: 8 },
      { questionId: 'q-5', value: 'Better export capabilities to PDF or Excel would be incredible.' },
    ],
  },
  {
    id: 'resp-cs-3',
    formId: 'form-customer-feedback',
    submittedAt: '2026-08-09T02:45:00.000Z',
    respondentEmail: 'dev.kumar@startup.co',
    answers: [
      { questionId: 'q-1', value: 5 },
      { questionId: 'q-2', value: 'opt-1-1' }, // Daily
      { questionId: 'q-3', value: ['opt-3-1', 'opt-3-2', 'opt-3-3', 'opt-3-4', 'opt-3-5'] },
      { questionId: 'q-4', value: 10 },
      { questionId: 'q-5', value: 'Keep up the great work! Super fast performance.' },
    ],
  },
  {
    id: 'resp-cs-4',
    formId: 'form-customer-feedback',
    submittedAt: '2026-08-09T05:10:00.000Z',
    respondentEmail: 'emily.chen@agency.com',
    answers: [
      { questionId: 'q-1', value: 3 },
      { questionId: 'q-2', value: 'opt-1-3' }, // Monthly
      { questionId: 'q-3', value: ['opt-3-2'] },
      { questionId: 'q-4', value: 7 },
      { questionId: 'q-5', value: 'More video tutorials or onboarding guides for new team members.' },
    ],
  },
  {
    id: 'resp-cs-5',
    formId: 'form-customer-feedback',
    submittedAt: '2026-08-09T06:30:00.000Z',
    respondentEmail: 'michael.b@finance.org',
    answers: [
      { questionId: 'q-1', value: 5 },
      { questionId: 'q-2', value: 'opt-1-1' }, // Daily
      { questionId: 'q-3', value: ['opt-3-1', 'opt-3-5'] },
      { questionId: 'q-4', value: 10 },
      { questionId: 'q-5', value: 'Seamless experience overall.' },
    ],
  },

  // Responses for Python Quiz
  {
    id: 'resp-py-1',
    formId: 'form-python-quiz',
    submittedAt: '2026-08-08T09:00:00.000Z',
    respondentEmail: 'student1@university.edu',
    quizScore: { totalPoints: 40, earnedPoints: 40 },
    answers: [
      { questionId: 'q-py-1', value: 'opt-py1-2' }, // def
      { questionId: 'q-py-2', value: 'opt-py2-1' }, // <class 'list'>
      { questionId: 'q-py-3', value: ['opt-py3-1', 'opt-py3-2'] }, // List, Dictionary
      { questionId: 'q-py-4', value: 'len' },
    ],
  },
  {
    id: 'resp-py-2',
    formId: 'form-python-quiz',
    submittedAt: '2026-08-08T10:30:00.000Z',
    respondentEmail: 'coder.coder@gmail.com',
    quizScore: { totalPoints: 40, earnedPoints: 30 },
    answers: [
      { questionId: 'q-py-1', value: 'opt-py1-2' }, // def
      { questionId: 'q-py-2', value: 'opt-py2-1' }, // <class 'list'>
      { questionId: 'q-py-3', value: ['opt-py3-1'] }, // Missed dict
      { questionId: 'q-py-4', value: 'len' },
    ],
  },
  {
    id: 'resp-py-3',
    formId: 'form-python-quiz',
    submittedAt: '2026-08-09T01:15:00.000Z',
    respondentEmail: 'py.enthusiast@dev.net',
    quizScore: { totalPoints: 40, earnedPoints: 40 },
    answers: [
      { questionId: 'q-py-1', value: 'opt-py1-2' },
      { questionId: 'q-py-2', value: 'opt-py2-1' },
      { questionId: 'q-py-3', value: ['opt-py3-1', 'opt-py3-2'] },
      { questionId: 'q-py-4', value: 'len()' }, // lenient text match
    ],
  },
];
