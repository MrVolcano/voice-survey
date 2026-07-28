// Route A: "Full detail" - every outcome and every new-ability item from the
// real survey is asked as its own short voice question. Long, but faithful
// to the original SurveyMonkey structure.
(function () {
  const OUTCOME_OPTIONS = ['Yes', 'No', 'Too soon to tell', 'Not relevant to me'];
  const YES_NO = ['Yes', 'No'];

  const outcomes = [
    'more knowledgeable about technology',
    'more confident with technology in general',
    'more able to take part in new activities online',
    'better able to manage your day to day life online',
    'more independent',
    'less isolated',
    'less stressed',
    'able to use what you learnt in the sessions on your own, for example at home',
    'keen to learn more about using your device and technology in your life',
    'more confident using your own device specifically'
  ].map((phrase, i) => ({
    id: `outcome-${i}`,
    type: 'choice',
    text: `Since the training, do you feel ${phrase}?`,
    options: OUTCOME_OPTIONS
  }));

  const abilities = [
    'stay safer online',
    'connect with others, for example messaging or video calling',
    'manage your finances online, for example budgeting or online banking',
    'have fun online, for example watching videos or playing games',
    'learn and access information online, for example checking the news or the weather',
    'feel part of a community online, for example using social media',
    'organise your day to day life, for example using a calendar app or reminders',
    'manage your health online, for example booking appointments or ordering prescriptions',
    'manage a disability or health condition online, for example using a new app or assistive technology',
    'complete tasks related to education, employment or volunteering',
    'complete tasks related to job searching, for example creating a C V or applying for work'
  ].map((phrase, i) => ({
    id: `ability-${i}`,
    type: 'choice',
    text: `Can you now ${phrase}, more than before the sessions?`,
    options: YES_NO
  }));

  window.SURVEY_ROUTE_ID = 'full';
  window.SURVEY_ROUTE_LABEL = 'Full detail (every question asked)';
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
    ...outcomes,
    ...abilities,
    {
      id: 'other-new-things',
      type: 'text',
      text: 'Is there anything else you can now do online that we have not already covered?'
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
