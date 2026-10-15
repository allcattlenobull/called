/**
 * The biblical framework behind Called. Every passage is tied to a principle and a question.
 * Quotations are from the King James Version (public domain) and always paired with a
 * plain-language summary. Called never presents a career as a message from God.
 */
export interface Passage {
  ref: string;
  kjv?: string;
  summary: string;
}

export interface Principle {
  id: string;
  name: string;
  question: string;
  idea: string;
  passages: Passage[];
  reflect: string[];
  inPractice: string;
}

export const PRINCIPLES: Principle[] = [
  {
    id: 'stewardship',
    name: 'Stewardship',
    question: 'What have you been entrusted with?',
    idea: 'Your abilities, opportunities, time, relationships and resources are gifts you’ve been given to care for and invest, not to bury or compare.',
    passages: [
      {
        ref: 'Matthew 25:14–30',
        summary: 'In the parable of the talents, servants are entrusted with different amounts. They aren’t judged by how much they were given, but by what they did with it.',
      },
      {
        ref: '1 Peter 4:10',
        kjv: 'As every man hath received the gift, even so minister the same one to another, as good stewards of the manifold grace of God.',
        summary: 'Whatever gift you have received, use it to serve others, as a good manager of what God has given.',
      },
    ],
    reflect: ['What opportunities do you have that others around you don’t?', 'What gift have you been tempted to bury because it seemed small?'],
    inPractice: 'In Called, stewardship shows up in your Skills, Aptitudes and Gifts, and in the training cost and payoff tool, which treats time and money as things worth investing wisely.',
  },
  {
    id: 'gifts',
    name: 'Gifts',
    question: 'How are you equipped differently?',
    idea: 'People are made differently on purpose. Not everyone should follow the same path, and no gift is more valuable than another.',
    passages: [
      {
        ref: 'Romans 12:4–8',
        kjv: 'Having then gifts differing according to the grace that is given to us…',
        summary: 'Paul describes the church as one body with many members. Gifts like serving, teaching, encouraging, giving, leading and mercy are different, and all are needed.',
      },
      {
        ref: '1 Corinthians 12:4–6',
        kjv: 'Now there are diversities of gifts, but the same Spirit.',
        summary: 'There are different kinds of gifts, service and work, but they come from the same source and work together.',
      },
    ],
    reflect: ['Which of your gifts do you tend to downplay?', 'Whose path have you been comparing yours to?'],
    inPractice: 'Your Gifts and the Feedback others give you build the Gifts dimension of your Purpose Compass.',
  },
  {
    id: 'service',
    name: 'Service',
    question: 'Who can benefit from what you have?',
    idea: 'Gifts are meant to flow outward. Work becomes meaningful when it meets real needs of real people.',
    passages: [
      {
        ref: 'Matthew 25:35–40',
        summary: 'Feeding the hungry, welcoming the stranger and caring for the sick are described as serving Christ himself.',
      },
      {
        ref: 'Galatians 5:13',
        summary: 'Freedom is not for serving yourself but for serving one another in love.',
      },
    ],
    reflect: ['Who do you feel drawn toward helping?', 'Whose needs do you notice that others seem to overlook?'],
    inPractice: 'The Service and Problems dimensions of your compass come from these questions and shape your Purpose Match.',
  },
  {
    id: 'wisdom',
    name: 'Wisdom',
    question: 'What do evidence, experience, counsel and prayer suggest?',
    idea: 'Good decisions come from gathering evidence, seeking counsel and reflecting honestly, not from waiting for a lightning bolt.',
    passages: [
      {
        ref: 'Proverbs 15:22',
        kjv: 'Without counsel purposes are disappointed: but in the multitude of counsellors they are established.',
        summary: 'Plans fail without advice and succeed with many advisers.',
      },
      {
        ref: 'Proverbs 16:9',
        kjv: 'A man’s heart deviseth his way: but the LORD directeth his steps.',
        summary: 'We make plans, and God guides the steps. Planning and trust go together.',
      },
    ],
    reflect: ['Who are the wise people you could ask about your direction?', 'What does the evidence you’ve gathered so far actually suggest?'],
    inPractice: 'Called’s whole approach is built on this: simulations, experiments and interviews are ways of gathering evidence and counsel.',
  },
  {
    id: 'diligence',
    name: 'Diligence',
    question: 'What are you willing to become excellent at?',
    idea: 'Calling is rarely discovered fully formed. Much of it is built through faithful, patient practice.',
    passages: [
      {
        ref: 'Proverbs 22:29',
        kjv: 'Seest thou a man diligent in his business? he shall stand before kings…',
        summary: 'People who are skilled and diligent in their work will be trusted with more.',
      },
      {
        ref: 'Ecclesiastes 9:10',
        kjv: 'Whatsoever thy hand findeth to do, do it with thy might…',
        summary: 'Whatever is in front of you to do, do it with full effort.',
      },
    ],
    reflect: ['What would you practice for years even when it’s boring?', 'Where are you already showing up faithfully?'],
    inPractice: 'My Path turns direction into small, faithful steps you can actually complete.',
  },
  {
    id: 'good-work',
    name: 'Good work',
    question: 'How does your work serve people and the world?',
    idea: 'Work is not a curse or merely a paycheck. Building, teaching, healing, organizing and creating can all be good work that contributes to people and communities.',
    passages: [
      {
        ref: 'Colossians 3:23',
        kjv: 'And whatsoever ye do, do it heartily, as to the Lord, and not unto men.',
        summary: 'Whatever your work is, do it wholeheartedly, as working for God rather than just for people.',
      },
      {
        ref: 'Genesis 2:15',
        summary: 'Before anything went wrong, people were given work to do: to tend and keep the garden.',
      },
    ],
    reflect: ['Which kinds of work do you secretly look down on?', 'What would it look like to do ordinary work wholeheartedly?'],
    inPractice: 'Called includes trades, service and support roles alongside professional careers, because all good work matters.',
  },
  {
    id: 'calling',
    name: 'Calling',
    question: 'What is your calling beyond a job title?',
    idea: 'Calling is larger than a career. You may be called to faithfulness, to people, to a place or to a cause. A job can be one vehicle for it.',
    passages: [
      {
        ref: 'Ephesians 2:10',
        kjv: 'For we are his workmanship, created in Christ Jesus unto good works, which God hath before ordained that we should walk in them.',
        summary: 'You were created with purpose, for good works that God prepared in advance.',
      },
      {
        ref: '1 Corinthians 7:17',
        summary: 'Paul encourages people to live faithfully in the situation they are in, wherever they find themselves.',
      },
    ],
    reflect: ['What callings do you already have: to family, friends, church, community?', 'How could different careers carry the same calling?'],
    inPractice: 'Your Current Purpose Statement is about what you want your gifts to do in the world, not a job title.',
  },
  {
    id: 'purpose',
    name: 'Purpose',
    question: 'Is your purpose bigger than your occupation?',
    idea: 'Your career is not your purpose. Purpose matures over a lifetime and can be lived out through many jobs, seasons and roles.',
    passages: [
      {
        ref: 'Micah 6:8',
        summary: 'What is asked of us is to do justly, love mercy and walk humbly with God, in any job.',
      },
      {
        ref: 'Ecclesiastes 3:1',
        kjv: 'To every thing there is a season, and a time to every purpose under the heaven.',
        summary: 'Life has seasons. What fits this season may change in the next.',
      },
    ],
    reflect: ['If your first job doesn’t work out, what stays the same about your purpose?', 'What season are you in right now?'],
    inPractice: 'Called labels your statement as current on purpose and keeps a history so you can see how it matures.',
  },
];

export const PRINCIPLE_BY_ID = Object.fromEntries(PRINCIPLES.map((p) => [p.id, p]));
