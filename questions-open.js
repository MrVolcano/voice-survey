// Short version: the outcomes matrix and the new-abilities checklist
// from the real survey are each collapsed into a single open voice question,
// keeping the survey short enough to comfortably sit through by ear.
(function () {
  window.SURVEY_ROUTE_ID = 'open';
  window.SURVEY_ROUTE_LABEL = 'Short version';
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
      text: 'Where did the training take place? Say home, or say the venue name.'
    },
    {
      id: 'device-use',
      type: 'choice',
      text: 'How much do you use your device now?',
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
    {
      id: 'outcomes-open',
      type: 'text',
      text: 'What has changed for you since the sessions? For example, are you more confident, more independent, or less isolated.'
    },
    {
      id: 'abilities-open',
      type: 'text',
      text: 'What can you do now that you could not do before?'
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
