// Long version: every outcome and every new-ability item from the
// real survey is asked as its own short voice question. Long, but faithful
// to the original SurveyMonkey structure.
(function () {
  const OUTCOME_OPTIONS = ['Yes', 'No', 'Too soon', 'Not relevant'];
  const YES_NO = ['Yes', 'No'];

  const outcomes = [
    'more knowledgeable about technology',
    'more confident with technology',
    'able to try new things online',
    'better able to manage day to day life online',
    'more independent',
    'less isolated',
    'less stressed',
    'able to use what you learnt on your own',
    'keen to learn more about technology',
    'more confident using your own device'
  ].map((phrase, i) => ({
    id: `outcome-${i}`,
    type: 'choice',
    text: `Do you now feel ${phrase}?`,
    options: OUTCOME_OPTIONS
  }));

  const abilities = [
    'stay safer online',
    'connect with others, like messaging or video calls',
    'manage finances online, like budgeting or banking',
    'have fun online, like videos or games',
    'find information online, like news or weather',
    'feel part of an online community, like social media',
    'organise your day to day life, like a calendar or reminders',
    'manage your health online, like appointments or prescriptions',
    'manage a health condition online, like a new app or assistive technology',
    'do tasks for education, employment or volunteering',
    'do job searching tasks, like a C V or applying for work'
  ].map((phrase, i) => ({
    id: `ability-${i}`,
    type: 'choice',
    text: `Can you now ${phrase}?`,
    options: YES_NO
  }));

  window.SURVEY_ROUTE_ID = 'full';
  window.SURVEY_ROUTE_LABEL = 'Long version';
  window.SURVEY_QUESTIONS = [
    {
      id: 'session-type',
      type: 'choice',
      text: 'Was your session 1 to 1 or group?',
      options: ['1 to 1', 'Group', 'Both', 'Other']
    },
    {
      id: 'location',
      type: 'text',
      text: 'Where did the training take place? For example, home.'
    },
    {
      id: 'device-use',
      type: 'choice',
      text: 'Do you use your device more now?',
      options: ['More', 'About the same', 'Less']
    },
    {
      id: 'rating',
      type: 'choice',
      text: 'How would you rate the training?',
      options: ['Excellent', 'Good', 'Average', 'Poor']
    },
    {
      id: 'rating-why',
      type: 'text',
      text: 'Why did you rate it that way?'
    },
    ...outcomes,
    ...abilities,
    {
      id: 'other-new-things',
      type: 'text',
      text: 'Anything else you can now do online?'
    },
    {
      id: 'bt-funding',
      type: 'choice',
      text: 'These sessions were funded by BT. Does that change how you see BT?',
      options: ['Yes', 'No']
    },
    {
      id: 'bt-funding-why',
      type: 'text',
      text: 'Why is that?'
    },
    {
      id: 'anything-else',
      type: 'text',
      text: 'Anything else you would like to tell us about the trainer or the sessions?'
    }
  ];
})();
