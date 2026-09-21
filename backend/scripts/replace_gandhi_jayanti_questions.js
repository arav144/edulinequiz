const mongoose = require('mongoose');
require('dotenv').config();
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');

const classQuestions = {
  'Class 3': [
    {
      question: 'When is Mahatma Gandhi’s birthday celebrated each year?',
      options: { A: 'August 15', B: 'October 2', C: 'August 26', D: 'November 14' },
      correctOption: 'B',
      explanation: 'Mahatma Gandhi was born on October 2, 1869, which is celebrated across India as Gandhi Jayanti.',
    },
    {
      question: 'In which coastal town in the state of Gujarat was Mahatma Gandhi born?',
      options: { A: 'Porbandar', B: 'Ahmedabad', C: 'Surat', D: 'Rajkot' },
      correctOption: 'A',
      explanation: 'Mahatma Gandhi was born in Porbandar, a coastal city in Gujarat.',
    },
    {
      question: "By what affectionate name do people in India often call Mahatma Gandhi, which means 'father'?",
      options: { A: 'Netaji', B: 'Bapu', C: 'Chacha', D: 'Sardar' },
      correctOption: 'B',
      explanation: "Mahatma Gandhi is lovingly called 'Bapu', which means father in Gujarati.",
    },
    {
      question: 'What was Gandhiji’s full name before he was given the title “Mahatma Gandhi”?',
      options: {
        A: 'Mohandas Karamchand Gandhi',
        B: 'Mahatma Karamchand Gandhi',
        C: 'Mohanlal K. Gandhi',
        D: 'Karamchand Uttamchand Gandhi',
      },
      correctOption: 'A',
      explanation: 'His birth name was Mohandas Karamchand Gandhi. The title Mahatma was later given to him.',
    },
    {
      question: 'What was the name of Mahatma Gandhi’s mother, who greatly influenced his spiritual values and simple lifestyle?',
      options: { A: 'Kasturba Gandhi', B: 'Putlibai Gandhi', C: 'Kamla Nehru', D: 'Sarojini Naidu' },
      correctOption: 'B',
      explanation: 'Putlibai was the mother of Mahatma Gandhi, known for her piety and devotion.',
    },
    {
      question: 'Which king greatly inspired Mahatma Gandhi with his unwavering commitment to truth?',
      options: { A: 'King Harishchandra', B: 'King Ashoka', C: 'King Akbar', D: 'King Vikramaditya' },
      correctOption: 'A',
      explanation: 'The play of King Harishchandra inspired young Gandhi to always follow the path of truth.',
    },
    {
      question: "What does the word 'Ahimsa', a major guiding principle for Mahatma Gandhi, mean in English?",
      options: { A: 'Speaking loudly', B: 'Fighting back with force', C: 'Running away from trouble', D: 'Non-violence' },
      correctOption: 'D',
      explanation: "'Ahimsa' translates to non-violence in thought, word, and deed.",
    },
    {
      question: 'What other value along with non-violence did Mahatma Gandhi consider his greatest guide and moral compass in life?',
      options: { A: 'Satya (truth)', B: 'Wealth (gold and money)', C: 'Power and control', D: 'Speed and efficiency' },
      correctOption: 'A',
      explanation: 'Satya (Truth) and Ahimsa (Non-violence) were the two core pillars of Gandhi’s philosophy.',
    },
    {
      question: 'What was the name of the special home or ashram that Mahatma Gandhi built on the banks of a river in Gujarat?',
      options: { A: 'Wardha Ashram', B: 'Sabarmati Ashram', C: 'Tolstoy Farm', D: 'Shantiniketan' },
      correctOption: 'B',
      explanation: 'Mahatma Gandhi established the Sabarmati Ashram on the banks of the River Sabarmati in Ahmedabad.',
    },
    {
      question: 'What is the name of the traditional wooden spinning wheel that Mahatma Gandhi used to make his own cloth (Khadi)?',
      options: { A: 'Potter’s Wheel', B: 'Foot-pedal loom', C: 'Charkha', D: 'Sewing machine' },
      correctOption: 'C',
      explanation: 'Gandhi used the Charkha (spinning wheel) as a symbol of self-reliance and swadeshi.',
    },
    {
      question: 'Why did Mahatma Gandhi lead the famous Dandi March (Salt March) in 1930?',
      options: {
        A: 'To protest against the unfair tax on salt imposed by the British',
        B: 'To find a hidden treasure chest by the ocean',
        C: 'To celebrate a good monsoon rain season',
        D: 'To build a long highway across India',
      },
      correctOption: 'A',
      explanation: 'The Salt March was a major non-violent protest against the British tax on producing and selling salt.',
    },
    {
      question: "What special day do the United Nations and the world celebrate on Mahatma Gandhi's birthday (October 2nd)?",
      options: {
        A: 'World Environment Day',
        B: 'International Peace Day',
        C: 'Global Friendship Day',
        D: 'International Day of Non-violence',
      },
      correctOption: 'D',
      explanation: 'The United Nations General Assembly declared October 2 as the International Day of Non-Violence.',
    },
    {
      question: 'In which country did Gandhi go to study law to become a barrister?',
      options: { A: 'America', B: 'England', C: 'Japan', D: 'Russia' },
      correctOption: 'B',
      explanation: 'Gandhi sailed to London, England in 1888 to study law at University College London.',
    },
    {
      question: "What is the name of Gandhi's childhood home in Porbandar today?",
      options: { A: 'Kirti Mandir', B: 'Shanti Niwas', C: 'Sabarmati Bhavan', D: 'Putlibai Niwas' },
      correctOption: 'A',
      explanation: 'Kirti Mandir is the memorial temple built adjacent to Gandhi’s ancestral home in Porbandar.',
    },
    {
      question: "Who first referred to Mahatma Gandhi as the 'Father of the Nation' during a radio address in 1944?",
      options: { A: 'JawaharLal Nehru', B: 'Subhash Chandra Bose', C: 'Rabindranath Tagore', D: 'Sardar Vallabhbhai Patel' },
      correctOption: 'B',
      explanation: 'Netaji Subhash Chandra Bose addressed Mahatma Gandhi as Father of the Nation from Singapore in 1944.',
    },
  ],

  'Class 4': [
    {
      question: "What is the name of Gandhi's childhood home in Porbandar today?",
      options: { A: 'Kirti Mandir', B: 'Shanti Niwas', C: 'Sabarmati Bhavan', D: 'Putlibai Niwas' },
      correctOption: 'A',
      explanation: 'Kirti Mandir in Porbandar marks the birthplace and ancestral home of Mahatma Gandhi.',
    },
    {
      question: "Who first referred to Mahatma Gandhi as the 'Father of the Nation' during a radio address in 1944?",
      options: { A: 'JawaharLal Nehru', B: 'Subhash Chandra Bose', C: 'Rabindranath Tagore', D: 'Sardar Vallabhbhai Patel' },
      correctOption: 'B',
      explanation: 'Netaji Subhash Chandra Bose first called him the Father of the Nation over Azad Hind Radio in 1944.',
    },
    {
      question: 'In which country did Gandhi go to study law to become a barrister?',
      options: { A: 'America', B: 'England', C: 'Japan', D: 'Russia' },
      correctOption: 'B',
      explanation: 'Gandhi traveled to England to study law at the Inner Temple.',
    },
    {
      question: 'When is Mahatma Gandhi’s birthday celebrated each year?',
      options: { A: 'August 15', B: 'October 2', C: 'August 26', D: 'November 14' },
      correctOption: 'B',
      explanation: 'Gandhi Jayanti is observed annually on October 2nd across India.',
    },
    {
      question: 'In which coastal town in the state of Gujarat was Mahatma Gandhi born?',
      options: { A: 'Porbandar', B: 'Ahmedabad', C: 'Surat', D: 'Rajkot' },
      correctOption: 'A',
      explanation: 'He was born in the coastal city of Porbandar, Gujarat.',
    },
    {
      question: "By what affectionate name do people in India often call Mahatma Gandhi, which means 'father'?",
      options: { A: 'Netaji', B: 'Bapu', C: 'Chacha', D: 'Sardar' },
      correctOption: 'B',
      explanation: "'Bapu' is the affectionate term meaning father in Gujarati.",
    },
    {
      question: 'What was Gandhiji’s full name before he was given the title “Mahatma Gandhi”?',
      options: {
        A: 'Mohandas Karamchand Gandhi',
        B: 'Mahatma Karamchand Gandhi',
        C: 'Mohanlal K. Gandhi',
        D: 'Karamchand Uttamchand Gandhi',
      },
      correctOption: 'A',
      explanation: 'His full name was Mohandas Karamchand Gandhi.',
    },
    {
      question: 'What was the name of Mahatma Gandhi’s mother, who greatly influenced his spiritual values and simple lifestyle?',
      options: { A: 'Kasturba Gandhi', B: 'Putlibai Gandhi', C: 'Kamla Nehru', D: 'Sarojini Naidu' },
      correctOption: 'B',
      explanation: 'Putlibai was his mother whose spiritual teachings left a lifelong imprint on him.',
    },
    {
      question: 'Which king greatly inspired Mahatma Gandhi with his unwavering commitment to truth?',
      options: { A: 'King Harishchandra', B: 'King Ashoka', C: 'King Akbar', D: 'King Vikramaditya' },
      correctOption: 'A',
      explanation: 'The legendary Raja Harishchandra’s devotion to truth deeply inspired Gandhi.',
    },
    {
      question: "What does the word 'Ahimsa', a major guiding principle for Mahatma Gandhi, mean in English?",
      options: { A: 'Speaking loudly', B: 'Fighting back with force', C: 'Running away from trouble', D: 'Non-violence' },
      correctOption: 'D',
      explanation: 'Ahimsa translates directly to non-violence.',
    },
    {
      question: 'What other value along with non-violence did Mahatma Gandhi consider his greatest guide and moral compass in life?',
      options: { A: 'Satya (truth)', B: 'Wealth (gold and money)', C: 'Power and control', D: 'Speed and efficiency' },
      correctOption: 'A',
      explanation: 'Satya (Truth) was considered the ultimate virtue by Mahatma Gandhi.',
    },
    {
      question: 'What was the name of the special home or ashram that Mahatma Gandhi built on the banks of a river in Gujarat?',
      options: { A: 'Wardha Ashram', B: 'Sabarmati Ashram', C: 'Tolstoy Farm', D: 'Shantiniketan' },
      correctOption: 'B',
      explanation: 'Sabarmati Ashram in Ahmedabad was the epicenter of many of Gandhi’s freedom movements.',
    },
    {
      question: 'What is the name of the traditional wooden spinning wheel that Mahatma Gandhi used to make his own cloth (Khadi)?',
      options: { A: 'Potter’s Wheel', B: 'Foot-pedal loom', C: 'Charkha', D: 'Sewing machine' },
      correctOption: 'C',
      explanation: 'The Charkha was used by Gandhiji daily to spin khadi yarn.',
    },
    {
      question: 'Why did Mahatma Gandhi lead the famous Dandi March (Salt March) in 1930?',
      options: {
        A: 'To protest against the unfair tax on salt imposed by the British',
        B: 'To find a hidden treasure chest by the ocean',
        C: 'To celebrate a good monsoon rain season',
        D: 'To build a long highway across India',
      },
      correctOption: 'A',
      explanation: 'The Dandi Salt March was conducted to defy the colonial British salt monopoly.',
    },
    {
      question: "What special day do the United Nations and the world celebrate on Mahatma Gandhi's birthday (October 2nd)?",
      options: {
        A: 'World Environment Day',
        B: 'International Peace Day',
        C: 'Global Friendship Day',
        D: 'International Day of Non-violence',
      },
      correctOption: 'D',
      explanation: 'The UN observes October 2nd worldwide as the International Day of Non-Violence.',
    },
  ],

  'Class 5': [
    {
      question: 'What is Mahatma Gandhi’s Resting Place (Samadhi) in Delhi called?',
      options: { A: 'Raj Ghat', B: 'Vijay Ghat', C: 'Shanti Vana', D: 'Gandhi Museum' },
      correctOption: 'A',
      explanation: 'Raj Ghat is the memorial dedicated to Mahatma Gandhi located on the banks of the Yamuna River in Delhi.',
    },
    {
      question: 'Which was Gandhi Ji’s first major Andolan (movement) in India in 1917?',
      options: { A: 'Champaran Satyagraha', B: 'Quit India Movement', C: 'Dandi March', D: 'Non-Cooperation Movement' },
      correctOption: 'A',
      explanation: 'Champaran Satyagraha in Bihar (1917) was Gandhiji’s first major civil disobedience movement in India.',
    },
    {
      question: 'In which year did the famous Dandi March (Salt March) take place?',
      options: { A: '1920', B: '1930', C: '1942', D: '1950' },
      correctOption: 'B',
      explanation: 'The Dandi March took place from 12 March to 6 April 1930.',
    },
    {
      question: 'What famous slogan did Gandhi Ji give during the Quit India Movement in 1942?',
      options: { A: 'Jai Hind', B: 'Do or Die (Karo ya Maro)', C: 'Inquilab Zindabad', D: 'Tum mujhe khoon do mai tumhe aazadi dunga' },
      correctOption: 'B',
      explanation: "Gandhi gave the clarion call 'Do or Die' (Karo ya Maro) at Gowalia Tank Maidan in Bombay.",
    },
    {
      question: 'Why did Gandhi Ji stop the Non-Cooperation Movement in 1922?',
      options: {
        A: 'Because of violence at Chauri Chaura',
        B: 'Because he was tired',
        C: 'Because the British left India',
        D: 'Because Indians got freedom',
      },
      correctOption: 'A',
      explanation: 'The violent clash at Chauri Chaura police station in February 1922 led Gandhi to immediately call off the movement.',
    },
    {
      question: 'What other value, along with non-violence did Mahatma Gandhi consider his greatest guide and moral compass in life?',
      options: { A: 'Satya (truth)', B: 'Wealth (gold and money)', C: 'Power and control', D: 'Speed and efficiency' },
      correctOption: 'A',
      explanation: 'Gandhi believed that Truth is God, and lived his life around Satya and Ahimsa.',
    },
    {
      question: 'What was the name of the special home or ashram that Mahatma Gandhi built on the banks of a river in Gujarat?',
      options: { A: 'Wardha Ashram', B: 'Sabarmati Ashram', C: 'Tolstoy Farm', D: 'Shantiniketan' },
      correctOption: 'B',
      explanation: 'Sabarmati Ashram on the banks of the Sabarmati River served as his main base of operations.',
    },
    {
      question: 'In which country did Mahatma Gandhi start a newspaper called ‘Indian Opinion’?',
      options: { A: 'London', B: 'America', C: 'South Africa', D: 'England' },
      correctOption: 'C',
      explanation: 'Gandhi established the Indian Opinion newspaper in 1903 in South Africa to fight racial discrimination.',
    },
    {
      question: 'What does ‘Satyagraha’ mainly refer to?',
      options: {
        A: 'Winning through violence',
        B: 'Holding firmly to truth through non-violent resistance',
        C: 'Fighting in a war',
        D: 'Refusing to follow any rules',
      },
      correctOption: 'B',
      explanation: 'Satyagraha literally means holding firmly to Truth (Truth-Force or Soul-Force) without hatred or violence.',
    },
    {
      question: 'Gandhi Jayanti is celebrated mainly to remember Gandhi’s contribution to:',
      options: {
        A: "India's freedom struggle and his message of truth and non-violence",
        B: "India's space programme",
        C: "India's industrial development",
        D: "India's sports achievements",
      },
      correctOption: 'A',
      explanation: 'We celebrate Gandhi Jayanti to honour his leadership in the independence struggle through truth and non-violence.',
    },
    {
      question: 'What did Gandhi mean by the idea of ‘Swaraj’?',
      options: { A: 'Rule by foreign countries', B: 'Self-rule and self-governance', C: 'Rule by kings', D: 'Military rule' },
      correctOption: 'B',
      explanation: 'Swaraj emphasizes self-rule, self-reliance, and moral governance by the people.',
    },
    {
      question: 'Which place became closely associated with Gandhi’s early struggle for farmers in India?',
      options: { A: 'Champaran', B: 'Shimla', C: 'Kolkata', D: 'Amritsar' },
      correctOption: 'A',
      explanation: 'Champaran in Bihar was where Gandhi fought for the rights of indigo farmers forced by British landlords.',
    },
    {
      question: 'Which situation is the best example of ‘truth and non-violence’ working together?',
      options: {
        A: 'Hiding a mistake to avoid punishment',
        B: 'Admitting a mistake and trying to correct it peacefully',
        C: 'Blaming someone else',
        D: 'Fighting with the person who complained',
      },
      correctOption: 'B',
      explanation: 'Honesty (truth) combined with peaceful accountability (non-violence) exemplifies Gandhian values.',
    },
    {
      question: 'Which pair is correctly matched?',
      options: {
        A: 'Dandi — Salt March',
        B: 'Champaran — Quit India Movement',
        C: 'South Africa — Dandi March',
        D: 'Porbandar — Salt Satyagraha',
      },
      correctOption: 'A',
      explanation: 'Dandi is the coastal village where Mahatma Gandhi broke the Salt Law in 1930.',
    },
    {
      question: 'Gandhi worked to challenge the unfair practice of untouchability. Which value was central to this effort?',
      options: { A: 'Social equality', B: 'Competition', C: 'Luxury', D: 'Isolation' },
      correctOption: 'A',
      explanation: 'He championed equality and dignified humanity, referring to lower castes as Harijans (Children of God).',
    },
  ],

  'Class 6': [
    {
      question: 'What does ‘Satyagraha’ mainly refer to?',
      options: {
        A: 'Winning through violence',
        B: 'Holding firmly to truth through non-violent resistance',
        C: 'Fighting in a war',
        D: 'Refusing to follow any rules',
      },
      correctOption: 'B',
      explanation: 'Satyagraha is a philosophy and practice of nonviolent resistance developed by Mahatma Gandhi.',
    },
    {
      question: "Gandhi Jayanti is celebrated nationwide primarily to remember Mahatma Gandhi's role in:",
      options: {
        A: "India's freedom struggle and his message of truth and non-violence",
        B: "India's space programme",
        C: "India's industrial development",
        D: "India's sports achievements",
      },
      correctOption: 'A',
      explanation: 'It honors his central role in the independence struggle using moral and non-violent means.',
    },
    {
      question: 'What did Gandhi mean by the idea of ‘Swaraj’?',
      options: { A: 'Rule by foreign countries', B: 'Self-rule and self-governance', C: 'Rule by kings', D: 'Military rule' },
      correctOption: 'B',
      explanation: 'Swaraj implies both national independence and personal self-discipline.',
    },
    {
      question: 'Which place became closely associated with Gandhi’s early struggle for farmers in India?',
      options: { A: 'Champaran', B: 'Shimla', C: 'Kolkata', D: 'Amritsar' },
      correctOption: 'A',
      explanation: 'The Champaran Satyagraha of 1917 marked Gandhi’s first successful campaign for Indian farmers.',
    },
    {
      question: 'In which year did the famous Dandi March (Salt March) take place?',
      options: { A: '1920', B: '1930', C: '1942', D: '1950' },
      correctOption: 'B',
      explanation: 'The historic Dandi March commenced on March 12, 1930 from Sabarmati Ashram.',
    },
    {
      question: 'What famous slogan did Gandhi Ji give during the Quit India Movement in 1942?',
      options: { A: 'Jai Hind', B: 'Do or Die (Karo ya Maro)', C: 'Inquilab Zindabad', D: 'Tum mujhe khoon do mai tumhe aazadi dunga' },
      correctOption: 'B',
      explanation: 'He raised the slogan ‘Do or Die’ to inspire the final push for independence.',
    },
    {
      question: 'Why did Gandhi Ji stop the Non-Cooperation Movement in 1922?',
      options: {
        A: 'Because of violence at Chauri Chaura',
        B: 'Because he was tired',
        C: 'Because the British left India',
        D: 'Because Indians got freedom',
      },
      correctOption: 'A',
      explanation: 'The violent attack on policemen at Chauri Chaura prompted him to call off the movement.',
    },
    {
      question: 'What other value along with non-violence, did Mahatma Gandhi consider his greatest guide and moral compass in life?',
      options: { A: 'Satya (truth)', B: 'Wealth (gold and money)', C: 'Power and control', D: 'Speed and efficiency' },
      correctOption: 'A',
      explanation: 'Satya (Truth) was considered supreme by Mahatma Gandhi.',
    },
    {
      question: 'What was the name of the special home or ashram that Mahatma Gandhi built on the banks of a river in Gujarat?',
      options: { A: 'Wardha Ashram', B: 'Sabarmati Ashram', C: 'Tolstoy Farm', D: 'Shantiniketan' },
      correctOption: 'B',
      explanation: 'Sabarmati Ashram was established in Ahmedabad.',
    },
    {
      question: '‘Indian Opinion’ the newspaper was started by Gandhi ji in which country?',
      options: { A: 'London', B: 'America', C: 'South Africa', D: 'England' },
      correctOption: 'C',
      explanation: 'Gandhi founded the Indian Opinion periodical in South Africa in 1903.',
    },
    {
      question: 'Which situation is the best example of ‘truth and non-violence’ working together?',
      options: {
        A: 'Hiding a mistake to avoid punishment',
        B: 'Admitting a mistake and trying to correct it peacefully',
        C: 'Blaming someone else',
        D: 'Fighting with the person who complained',
      },
      correctOption: 'B',
      explanation: 'Courageously accepting the truth and seeking peaceful resolution exemplifies non-violence.',
    },
    {
      question: 'Which pair is correctly matched?',
      options: {
        A: 'Dandi — Salt March',
        B: 'Champaran — Quit India Movement',
        C: 'South Africa — Dandi March',
        D: 'Porbandar — Salt Satyagraha',
      },
      correctOption: 'A',
      explanation: 'Dandi is the destination where Gandhi gathered natural salt in violation of the salt monopoly.',
    },
    {
      question: 'Gandhi worked to challenge the practice of untouchability. Which value was central to this effort?',
      options: { A: 'Social equality', B: 'Competition', C: 'Luxury', D: 'Isolation' },
      correctOption: 'A',
      explanation: 'Universal brotherhood and social equality motivated his campaign against untouchability.',
    },
    {
      question: 'Gandhi’s famous round spectacles are often seen today as a symbol of his:',
      options: { A: 'Simple lifestyle and identity', B: 'Love for sports', C: 'Military career', D: 'Interest in fashion' },
      correctOption: 'A',
      explanation: 'His round glasses, dhoti, and pocket watch symbolize his philosophy of simplicity.',
    },
    {
      question: 'Which king greatly inspired Mahatma Gandhi with his unwavering commitment to truth?',
      options: { A: 'King Harishchandra', B: 'King Ashoka', C: 'King Akbar', D: 'King Vikramaditya' },
      correctOption: 'A',
      explanation: 'The legend of King Harishchandra instilled in Gandhi an unyielding reverence for truth.',
    },
  ],

  'Class 7': [
    {
      question: 'Gandhi believed that education should help people develop:',
      options: {
        A: 'Only book knowledge',
        B: 'Character and practical skills along with knowledge',
        C: 'Only physical strength',
        D: 'Only business skills',
      },
      correctOption: 'B',
      explanation: 'Gandhi’s Nai Talim (Basic Education) focused on holistic development of head, heart, and hand.',
    },
    {
      question: 'Why did Gandhi encourage people to boycott foreign cloth?',
      options: {
        A: 'To promote Indian-made products',
        B: 'Because cloth was unavailable',
        C: 'To encourage people to stop wearing clothes',
        D: 'Because spinning was a sport',
      },
      correctOption: 'A',
      explanation: 'The boycott promoted Indian self-reliance (Swadeshi) and supported local weavers and artisans.',
    },
    {
      question: 'In which year did the famous Dandi March (Salt March) take place?',
      options: { A: '1920', B: '1930', C: '1942', D: '1950' },
      correctOption: 'B',
      explanation: 'The Salt March occurred in 1930, ending with the illegal making of salt at Dandi beach.',
    },
    {
      question: 'What famous slogan did Gandhi Ji give during the Quit India Movement in 1942?',
      options: { A: 'Jai Hind', B: 'Do or Die (Karo ya Maro)', C: 'Inquilab Zindabad', D: 'Tum mujhe khoon do mai tumhe aazadi dunga' },
      correctOption: 'B',
      explanation: "'Do or Die' was the rallying cry given by Gandhi during the Quit India Movement.",
    },
    {
      question: 'Why did Gandhi Ji stop the Non-Cooperation Movement in 1922?',
      options: {
        A: 'Because of violence at Chauri Chaura',
        B: 'Because he was tired',
        C: 'Because the British left India',
        D: 'Because Indians got freedom',
      },
      correctOption: 'A',
      explanation: 'Violence at Chauri Chaura went against his fundamental principle of strict non-violence.',
    },
    {
      question: 'What other value along with non-violence, did Mahatma Gandhi consider his greatest guide and moral compass in life?',
      options: { A: 'Satya (truth)', B: 'Wealth (gold and money)', C: 'Power and control', D: 'Speed and efficiency' },
      correctOption: 'A',
      explanation: 'Satya (Truth) and Ahimsa (Non-violence) were inseparable to Mahatma Gandhi.',
    },
    {
      question: 'What was the name of the special home or ashram that Mahatma Gandhi built on the banks of a river in Gujarat?',
      options: { A: 'Wardha Ashram', B: 'Sabarmati Ashram', C: 'Tolstoy Farm', D: 'Shantiniketan' },
      correctOption: 'B',
      explanation: 'Sabarmati Ashram in Ahmedabad was his residence from 1917 to 1930.',
    },
    {
      question: '‘Indian Opinion’ the newspaper was started by Gandhi ji in which country?',
      options: { A: 'London', B: 'America', C: 'South Africa', D: 'England' },
      correctOption: 'C',
      explanation: 'Gandhi began publishing Indian Opinion while living and campaigning in South Africa.',
    },
    {
      question: 'Which pair is correctly matched?',
      options: {
        A: 'Dandi — Salt March',
        B: 'Champaran — Quit India Movement',
        C: 'South Africa — Dandi March',
        D: 'Porbandar — Salt Satyagraha',
      },
      correctOption: 'A',
      explanation: 'Dandi was the culmination site of the 1930 Salt Satyagraha.',
    },
    {
      question: 'Which situation is the best example of ‘truth and non-violence’ working together?',
      options: {
        A: 'Hiding a mistake to avoid punishment',
        B: 'Admitting a mistake and trying to correct it peacefully',
        C: 'Blaming someone else',
        D: 'Fighting with the person who complained',
      },
      correctOption: 'B',
      explanation: 'Owning up to one’s actions with honesty and peaceful rectitude embodies Gandhian ideals.',
    },
    {
      question: 'Gandhi worked to challenge the practice of untouchability. Which value was central to this effort?',
      options: { A: 'Social equality', B: 'Competition', C: 'Luxury', D: 'Isolation' },
      correctOption: 'A',
      explanation: 'He tirelessly fought caste discrimination and advocated for universal social dignity.',
    },
    {
      question: 'Gandhi’s famous round spectacles are often seen today as a symbol of his:',
      options: { A: 'Simple lifestyle and identity', B: 'Love for sports', C: 'Military career', D: 'Interest in fashion' },
      correctOption: 'A',
      explanation: 'His round spectacles stand as an iconic international symbol of simplicity and peace.',
    },
    {
      question: 'Which king greatly inspired Mahatma Gandhi with his unwavering commitment to truth?',
      options: { A: 'King Harishchandra', B: 'King Ashoka', C: 'King Akbar', D: 'King Vikramaditya' },
      correctOption: 'A',
      explanation: 'The truthfulness of King Harishchandra had a profound formative impact on young Gandhi.',
    },
    {
      question: 'What was the name of Mahatma Gandhi’s mother, who greatly influenced his spiritual values and simple lifestyle?',
      options: { A: 'Kasturba Gandhi', B: 'Putlibai Gandhi', C: 'Kamla Nehru', D: 'Sarojini Naidu' },
      correctOption: 'B',
      explanation: 'Putlibai was Gandhi’s mother, whose deep religious faith influenced his moral character.',
    },
    {
      question: 'In which coastal town in the state of Gujarat was Mahatma Gandhi born?',
      options: { A: 'Porbandar', B: 'Ahmedabad', C: 'Surat', D: 'Rajkot' },
      correctOption: 'A',
      explanation: 'Mahatma Gandhi was born in the coastal town of Porbandar on October 2, 1869.',
    },
  ],

  'Class 8': [
    {
      question: 'What does ‘Satyagraha’ mainly refer to?',
      options: {
        A: 'Winning through violence',
        B: 'Holding firmly to truth through non-violent resistance',
        C: 'Fighting in a war',
        D: 'Refusing to follow any rules',
      },
      correctOption: 'B',
      explanation: 'Satyagraha is passive resistance rooted in truth, love, and refusal to harm the oppressor.',
    },
    {
      question: 'Gandhi Jayanti is celebrated mainly to remember Gandhi’s contribution to:',
      options: {
        A: "India's freedom struggle and his message of truth and non-violence",
        B: "India's space programme",
        C: "India's industrial development",
        D: "India's sports achievements",
      },
      correctOption: 'A',
      explanation: 'It commemorates his legacy of truth, non-violence, and self-sacrifice for Indian independence.',
    },
    {
      question: 'What did Gandhi mean by the idea of ‘Swaraj’?',
      options: { A: 'Rule by foreign countries', B: 'Self-rule and self-governance', C: 'Rule by kings', D: 'Military rule' },
      correctOption: 'B',
      explanation: 'Swaraj represents freedom, self-reliance, and democratic governance by the citizens.',
    },
    {
      question: 'Which place became closely associated with Gandhi’s early struggle for farmers in India?',
      options: { A: 'Champaran', B: 'Shimla', C: 'Kolkata', D: 'Amritsar' },
      correctOption: 'A',
      explanation: 'Champaran was the birthplace of Satyagraha in India against forced indigo cultivation.',
    },
    {
      question: 'In which year did the famous Dandi March (Salt March) take place?',
      options: { A: '1920', B: '1930', C: '1942', D: '1950' },
      correctOption: 'B',
      explanation: 'The 240-mile Salt March took place in the spring of 1930.',
    },
    {
      question: 'What famous slogan did Gandhi Ji give during the Quit India Movement in 1942?',
      options: { A: 'Jai Hind', B: 'Do or Die (Karo ya Maro)', C: 'Inquilab Zindabad', D: 'Tum mujhe khoon do mai tumhe aazadi dunga' },
      correctOption: 'B',
      explanation: "'Do or Die' rallied the nation for the decisive push toward complete self-rule.",
    },
    {
      question: 'Why did Gandhi Ji stop the Non-Cooperation Movement in 1922?',
      options: {
        A: 'Because of violence at Chauri Chaura',
        B: 'Because he was tired',
        C: 'Because the British left India',
        D: 'Because Indians got freedom',
      },
      correctOption: 'A',
      explanation: 'He halted the movement when a police station was torched at Chauri Chaura, Uttar Pradesh.',
    },
    {
      question: 'What other value along with non-violence, did Mahatma Gandhi consider his greatest guide and moral compass in life?',
      options: { A: 'Satya (truth)', B: 'Wealth (gold and money)', C: 'Power and control', D: 'Speed and efficiency' },
      correctOption: 'A',
      explanation: 'Truth (Satya) was considered by Gandhi to be the divine law of existence.',
    },
    {
      question: 'What was the name of the special home or ashram that Mahatma Gandhi built on the banks of a river in Gujarat?',
      options: { A: 'Wardha Ashram', B: 'Sabarmati Ashram', C: 'Tolstoy Farm', D: 'Shantiniketan' },
      correctOption: 'B',
      explanation: 'Sabarmati Ashram on the banks of River Sabarmati served as his main residence and headquarters.',
    },
    {
      question: 'Which situation is the best example of ‘truth and non-violence’ working together?',
      options: {
        A: 'Hiding a mistake to avoid punishment',
        B: 'Admitting a mistake and trying to correct it peacefully',
        C: 'Blaming someone else',
        D: 'Fighting with the person who complained',
      },
      correctOption: 'B',
      explanation: 'Transparently admitting a mistake and resolving it without hostility proves true moral strength.',
    },
    {
      question: 'Which pair is correctly matched?',
      options: {
        A: 'Dandi — Salt March',
        B: 'Champaran — Quit India Movement',
        C: 'South Africa — Dandi March',
        D: 'Porbandar — Salt Satyagraha',
      },
      correctOption: 'A',
      explanation: 'Dandi was where Gandhi broke the British Salt Act on April 6, 1930.',
    },
    {
      question: 'Gandhi worked to challenge the practice of untouchability. Which value was central to this effort?',
      options: { A: 'Social equality', B: 'Competition', C: 'Luxury', D: 'Isolation' },
      correctOption: 'A',
      explanation: 'He championed equality, human dignity, and moral reform across all communities.',
    },
    {
      question: '‘Indian Opinion’ the newspaper was started by Gandhi ji in which country?',
      options: { A: 'London', B: 'America', C: 'South Africa', D: 'England' },
      correctOption: 'C',
      explanation: 'Indian Opinion was established in Natal, South Africa in 1903.',
    },
    {
      question: 'Gandhi’s famous round spectacles are often seen today as a symbol of his:',
      options: { A: 'Simple lifestyle and identity', B: 'Love for sports', C: 'Military career', D: 'Interest in fashion' },
      correctOption: 'A',
      explanation: 'His circular spectacles symbolize austere living, moral clarity, and non-violence worldwide.',
    },
    {
      question: 'What was the name of Mahatma Gandhi’s mother, who greatly influenced his spiritual values and simple lifestyle?',
      options: { A: 'Kasturba Gandhi', B: 'Putlibai Gandhi', C: 'Kamla Nehru', D: 'Sarojini Naidu' },
      correctOption: 'B',
      explanation: 'Putlibai was Mahatma Gandhi’s mother, known for her devotion and influence on his character.',
    },
  ],
};

async function execute() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB Atlas');

  for (const [className, questions] of Object.entries(classQuestions)) {
    console.log(`\nProcessing ${className}...`);

    // Find the Gandhi Jayanti quiz for this class
    let quiz = await Quiz.findOne({
      targetClass: className,
      name: /Gandhi|गांधी/i,
    });

    if (!quiz) {
      console.log(`Quiz for ${className} not found with Gandhi name, searching by targetClass...`);
      quiz = await Quiz.findOne({ targetClass: className });
    }

    if (!quiz) {
      console.error(`❌ Could not find any quiz for ${className}`);
      continue;
    }

    console.log(`Updating Quiz: "${quiz.name}" (ID: ${quiz._id}) for ${className}`);

    // Update Quiz Details
    quiz.name = `Gandhi Jayanti Special Quiz - ${className}`;
    quiz.language = 'en';
    quiz.numberOfQuestions = questions.length;
    quiz.totalMarks = questions.length;
    quiz.passingPercentage = 50;
    quiz.description = 'Celebrate Gandhi Jayanti with an inspiring quiz on the life, values, and historic milestones of Mahatma Gandhi.';
    quiz.instructions = 'Read each question carefully. Select the best option among A, B, C, and D. You have 40 seconds per question.';
    await quiz.save();

    // Remove existing questions for this quiz
    const deleteResult = await Question.deleteMany({ quizId: quiz._id });
    console.log(`Deleted ${deleteResult.deletedCount} old questions.`);

    // Insert new questions
    const questionDocs = questions.map((q, idx) => ({
      quizId: quiz._id,
      questionNumber: idx + 1,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctOption,
      explanation: q.explanation,
      marks: 1,
      negativeMarks: 0,
      timeLimitSeconds: 40,
    }));

    await Question.insertMany(questionDocs);
    console.log(`✅ Inserted ${questionDocs.length} English questions for ${className}.`);
  }

  console.log('\n🎉 ALL CLASSES (Class 3 to 8) GANDHI JAYANTI QUIZZES UPDATED SUCCESSFULLY!');
  process.exit(0);
}

execute().catch((err) => {
  console.error('Execution error:', err);
  process.exit(1);
});
