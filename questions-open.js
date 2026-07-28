// Route B: "Open-ended" - the outcomes matrix and the new-abilities checklist
// from the real survey are each collapsed into a single open voice question,
// keeping the survey short enough to comfortably sit through by ear.
(function () {
  window.SURVEY_ROUTE_ID = 'open';
  window.SURVEY_ROUTE_LABEL = 'Open-ended (short, free-text outcomes)';
  window.SURVEY_QUESTIONS = [
    {
      id: 'session-type',
      type: 'choice',
      text: 'Did you have a one to one session, or a group session?',
      options: ['One to one, just me and the trainer', 'A group session', 'A mixture of one to one and group', 'Other']
    },
    {
      id: 'location',
      type: 'text',
      text: 'Where did your training take place? You can just say "home", or the name of the place.'
    },
    {
      id: 'device-use',
      type: 'choice',
      text: 'Do you use your device more since attending the sessions?',
      options: ['Yes, more', 'About the same', 'No, less']
    },
    {
      id: 'rating',
      type: 'choice',
      text: 'Overall, how would you rate the training sessions?',
      options: ['Excellent', 'Good', 'Average', 'Poor']
    },
    {
      id: 'rating-why',
      type: 'text',
      text: 'Please tell me why you rated the sessions that way.'
    },
    {
      id: 'outcomes-open',
      type: 'text',
      text: 'Since the sessions, what has changed for you? For example, are you more confident, more independent, less isolated, or doing more online?'
    },
    {
      id: 'abilities-open',
      type: 'text',
      text: 'What are you able to do now that you could not do before, or feel more comfortable doing?'
    },
    {
      id: 'bt-funding',
      type: 'choice',
      text: 'These sessions were funded by BT. Knowing that, does it change how you see BT?',
      options: ['Yes', 'No']
    },
    {
      id: 'bt-funding-why',
      type: 'text',
      text: 'Please tell me a bit more about why.'
    },
    {
      id: 'anything-else',
      type: 'text',
      text: 'Is there anything else you would like to tell us, about the trainer, the sessions, or the difference they have made for you?'
    }
  ];
})();
