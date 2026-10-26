const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Subject = require('../models/Subject');

const BATCH_ID = 'batch_1792224812790_714';
const BATCH_NAME = 'World Science Day Quiz 2026';
const BANNER_URL = 'https://res.cloudinary.com/ulk2jofl/image/upload/v1792261500/quiz-system/questions/images/xsfmgu3eo8ewlgfqppo0.png';
const START_DATE = new Date('2026-11-01T06:30:00.000Z');
const END_DATE = new Date('2026-11-01T07:30:00.000Z');
const TIMING = '12:00 pm – 01:00 pm (1 Hr)';

const quizDataByClass = {
  'Class 3': [
    {
      question: 'Which part of a plant is primarily responsible for absorbing water from the soil?',
      options: { A: 'Leaf', B: 'Flower', C: 'Root', D: 'Fruit' },
      correctAnswer: 'C',
      explanation: 'Roots anchor the plant in the soil and absorb water and essential minerals.'
    },
    {
      question: 'A money plant has a weak stem. It grows upwards by holding on to a wall or a stick. Such a plant is called a ___________.',
      options: { A: 'Tree', B: 'Climber', C: 'Shrub', D: 'Herb' },
      correctAnswer: 'B',
      explanation: 'Plants with weak stems that climb up supporting structures such as sticks or walls are known as climbers.'
    },
    {
      question: 'What does a sparrow’s choice of a tree as a nesting site indicate about its habitat?',
      options: {
        A: 'Trees provide shelter and nesting places for animals.',
        B: 'Trees depend on birds to attain greater heights.',
        C: 'Birds assist trees in preparing their food.',
        D: 'Sparrows are exclusively adapted to living in trees.'
      },
      correctAnswer: 'A',
      explanation: 'Trees serve as vital habitats, offering shelter, safety, and nesting sites for birds and other wildlife.'
    },
    {
      question: 'Which of the following practices contributes most significantly to minimizing water wastage during toothbrushing?',
      options: {
        A: 'Keep the tap running all the time',
        B: 'Brush under a running shower',
        C: 'Rinse the brush with a hose pipe',
        D: 'Turn off the tap and use a mug'
      },
      correctAnswer: 'D',
      explanation: 'Turning off the running tap and using a mug of water significantly conserves water every day.'
    },
    {
      question: 'Which of the following food products is derived directly from an animal as a source of nutrition?',
      options: { A: 'Rice', B: 'Milk', C: 'Spinach', D: 'Mango' },
      correctAnswer: 'B',
      explanation: 'Milk is an animal product obtained from cows, buffaloes, and goats, whereas rice, spinach, and mango are plant-based.'
    },
    {
      question: 'Why is it essential to maintain hand hygiene by washing our hands with soap before consuming food?',
      options: {
        A: 'To make our hands soft and shiny',
        B: 'To make the food taste sweeter',
        C: 'To remove germs that make us ill',
        D: 'To help our fingernails grow faster'
      },
      correctAnswer: 'C',
      explanation: 'Washing hands thoroughly with soap removes disease-causing germs, preventing infections and illness.'
    },
    {
      question: 'Although Rani’s eyes are closed, she can identify that halwa is being prepared in the kitchen. Which sensory organ enables her to detect the aroma of the cooking food?',
      options: { A: 'Eyes', B: 'Skin', C: 'Tongue', D: 'Nose' },
      correctAnswer: 'D',
      explanation: 'The nose contains olfactory receptors that detect smells and aromas in the surrounding air.'
    },
    {
      question: 'Which material would be most suitable for constructing a window that allows light to pass through and provides a clear view of the outside while preventing rainwater from entering?',
      options: { A: 'Cardboard', B: 'Glass', C: 'Cotton cloth', D: 'Wood' },
      correctAnswer: 'B',
      explanation: 'Glass is transparent and waterproof, allowing daylight to pass through while keeping rain out.'
    },
    {
      question: 'Which of the following biodegradable kitchen waste materials can be decomposed by microorganisms in a composting pit to produce nutrient-rich organic manure?',
      options: {
        A: 'Vegetable peels & fruit scraps',
        B: 'Plastic wrapper',
        C: 'Glass bottle',
        D: 'Empty metal can'
      },
      correctAnswer: 'A',
      explanation: 'Vegetable peels and fruit scraps are organic and biodegradable, decomposing into rich compost for plants.'
    },
    {
      question: 'Aman kept one plant in a dark cupboard and another near a sunny window. He watered both. After a week, the cupboard plant was pale and weak. What does this show?',
      options: {
        A: 'Plants grow best in the dark',
        B: 'Plants do not need water to grow',
        C: 'Cupboards help plants grow taller',
        D: 'Plants need sunlight to grow well'
      },
      correctAnswer: 'D',
      explanation: 'Green plants require sunlight to perform photosynthesis and produce their food; without light, they turn pale and wither.'
    },
    {
      question: 'Meera hangs two wet towels at the same time. One is in the sun and one is in the shade. What will most likely happen?',
      options: {
        A: 'The towel in the shade dries first',
        B: 'Both towels dry at the same time',
        C: 'The towel in the sun dries first',
        D: 'Both towels stay wet for a week'
      },
      correctAnswer: 'C',
      explanation: 'Direct heat and solar energy increase the rate of evaporation, causing the towel in the sun to dry faster.'
    },
    {
      question: 'Which of the following objects is most likely to remain afloat on the surface of water due to its relatively low density and buoyant properties?',
      options: { A: 'A dry leaf', B: 'A stone', C: 'An iron nail', D: 'A steel coin' },
      correctAnswer: 'A',
      explanation: 'A dry leaf has a density lower than that of water, allowing it to float on the surface.'
    },
    {
      question: 'Which of the following snack options provides the most balanced nutritional benefits to support a school-going child’s growth, energy requirements, and overall health?',
      options: {
        A: 'Potato chips and carbonated drinks',
        B: 'Fresh fruits and a handful of nuts',
        C: 'Candies and sweetened biscuits',
        D: 'Cream-filled cookies and sugary beverages'
      },
      correctAnswer: 'B',
      explanation: 'Fresh fruits and nuts provide essential vitamins, dietary minerals, fiber, healthy fats, and sustained energy.'
    },
    {
      question: 'In 2023, India’s Chandrayaan-3 lunar exploration mission successfully achieved a soft landing on which celestial body?',
      options: { A: 'The Sun', B: 'The Moon', C: 'Planet Mars', D: 'Ocean floor' },
      correctAnswer: 'B',
      explanation: 'On 23 August 2023, ISRO’s Chandrayaan-3 successfully made a historic soft landing near the south pole of the Moon.'
    },
    {
      question: 'What was the primary objective of the Chipko Movement, in which people embraced trees to prevent their destruction?',
      options: {
        A: 'To promote the commercial use of forest resources',
        B: 'To prevent deforestation and protect forest ecosystems',
        C: 'To encourage the construction of roads through forests',
        D: 'To increase the production of timber for industries'
      },
      correctAnswer: 'B',
      explanation: 'The Chipko Movement was a non-violent ecological movement in the Himalayas where villagers hugged trees to stop commercial felling and preserve forest ecosystems.'
    }
  ],

  'Class 4': [
    {
      question: 'In cactus plants, leaves are modified into sharp spines. How does this structural adaptation facilitate survival under the extreme arid conditions of desert ecosystems?',
      options: {
        A: 'It increases the rate of water absorption from the atmosphere.',
        B: 'It reduces water loss through transpiration and provides protection against herbivores.',
        C: 'It enhances the process of photosynthesis through the leaves.',
        D: 'It enables the plant to absorb nutrients directly from desert sand.'
      },
      correctAnswer: 'B',
      explanation: 'Modifying leaves into spines minimizes surface area to drastically reduce water loss via transpiration, while deterring browsing animals.'
    },
    {
      question: 'Which morphological adaptation enables a camel to move efficiently across loose, hot desert sand without sinking excessively?',
      options: { A: 'Sharp claws', B: 'Broad, padded feet', C: 'Long tail', D: 'Thick fur' },
      correctAnswer: 'B',
      explanation: 'Broad, cushioned pads on a camel’s feet distribute its body weight over a larger surface area, reducing pressure so it does not sink into soft sand.'
    },
    {
      question: 'Which essential nutrient is primarily responsible for tissue growth, cellular repair, and the maintenance of body structures?',
      options: { A: 'Carbohydrates', B: 'Fats', C: 'Proteins', D: 'Fibre' },
      correctAnswer: 'C',
      explanation: 'Proteins are the body’s building blocks, crucial for developing muscles, repairing damaged cells, and synthesizing enzymes.'
    },
    {
      question: 'A see-saw functions as a rigid bar that rotates about a fixed fulcrum. Which type of simple machine does this mechanism represent?',
      options: { A: 'Lever', B: 'Pulley', C: 'Wheel and axle', D: 'Screw' },
      correctAnswer: 'A',
      explanation: 'A see-saw is a classic Class 1 lever where the fulcrum is situated between the effort and the load.'
    },
    {
      question: 'What astronomical phenomenon is responsible for the periodic occurrence of day and night on Earth?',
      options: {
        A: 'The Sun goes around the Earth every day',
        B: 'Clouds cover the Sun every night',
        C: 'The Moon blocks the Sun every evening',
        D: "Earth's rotation on its axis."
      },
      correctAnswer: 'D',
      explanation: 'The Earth completes one full rotation on its imaginary axis every 24 hours, bringing different parts into sunlight (day) and shadow (night).'
    },
    {
      question: 'Which household practice is most effective in reducing the risk of waterborne diseases by ensuring the microbiological safety of drinking water?',
      options: {
        A: 'Store it in an open bucket',
        B: 'Boil or filter it, then keep it covered',
        C: 'Let everyone dip their own glass into the pot',
        D: 'Add a spoon of sugar to it'
      },
      correctAnswer: 'B',
      explanation: 'Boiling kills pathogenic bacteria, parasites, and viruses, while keeping water covered prevents recontamination.'
    },
    {
      question: 'Pulling a heavy bucket of water up from a well becomes easier if we use a:',
      options: { A: 'Pulley', B: 'Screw', C: 'Lever', D: 'Wedge' },
      correctAnswer: 'A',
      explanation: 'A fixed pulley changes the direction of the pulling force from upward to downward, making it much easier to lift a heavy bucket.'
    },
    {
      question: 'What is the primary functional advantage of constructing sloping roofs in regions experiencing heavy rainfall?',
      options: {
        A: 'To keep the rooms dark inside',
        B: 'To grow vegetables on top of the roof',
        C: 'To collect snow on the roof',
        D: 'To let rainwater flow off quickly'
      },
      correctAnswer: 'D',
      explanation: 'Sloping or pitched roofs allow rainwater and melted snow to drain off immediately, preventing leaks and structural water damage.'
    },
    {
      question: 'What explains the time difference between observing lightning and hearing the associated thunder during a thunderstorm?',
      options: {
        A: 'Sound travels faster than light',
        B: 'Light travels much faster than sound',
        C: 'Our ears work more slowly than our eyes',
        D: 'Thunder is made only after the lightning ends'
      },
      correctAnswer: 'B',
      explanation: 'Light travels at roughly 300,000 km/s reaching our eyes almost instantaneously, whereas sound travels at around 340 m/s through air.'
    },
    {
      question: 'Which of the following meals provides the most balanced combination of essential nutrients for maintaining overall health?',
      options: {
        A: 'Only rice with mango pickle',
        B: 'Samosa, chips and a cold drink',
        C: 'Rice, dal, vegetables and curd',
        D: 'Biscuits, cake and sweet tea'
      },
      correctAnswer: 'C',
      explanation: 'A meal of rice (carbohydrates), dal (protein), vegetables (vitamins and fiber), and curd (protein and calcium) provides a balanced diet.'
    },
    {
      question: 'Sonu planted a bean seed in each of two cups kept on the same windowsill. He watered only Cup 1. Only the seed in Cup 1 sprouted. What does this show?',
      options: {
        A: 'Seeds need water to sprout',
        B: 'Seeds sprout better in dry soil',
        C: 'Seeds need only sunlight to sprout',
        D: 'Seeds do not need any care to sprout'
      },
      correctAnswer: 'A',
      explanation: 'Moisture softens the seed coat and activates metabolic enzymes required for germination.'
    },
    {
      question: 'In a forest ecosystem, deer occupy a primary consumer level, while tigers function as predators. What would be the most immediate consequence of the removal of deer from this food chain?',
      options: {
        A: 'Grass growth ceases',
        B: 'Tigers consume grass',
        C: 'Rainfall increases',
        D: 'Food availability for tigers decreases'
      },
      correctAnswer: 'D',
      explanation: 'Tigers are carnivores dependent on herbivores like deer for prey; removing deer directly depletes the tigers’ primary food supply.'
    },
    {
      question: 'On a nature trail, you see a small bird with a long, thin, curved beak visiting flower after flower. What does this bird most likely feed on?',
      options: {
        A: 'Hard nuts and seeds',
        B: 'Fish from ponds',
        C: 'Nectar from flowers',
        D: 'Small animals that it tears apart'
      },
      correctAnswer: 'C',
      explanation: 'A slender, curved beak (like that of sunbirds or hummingbirds) is specialized for probing deep into floral corollas to sip nectar.'
    },
    {
      question: 'What was the primary conservation objective behind the launch of Project Tiger in India in 1973?',
      options: {
        A: 'To train tigers to perform in circuses',
        B: 'To protect tigers and their forests',
        C: 'To send tigers to other countries',
        D: 'To keep all tigers in zoos'
      },
      correctAnswer: 'B',
      explanation: 'Project Tiger was launched in 1973 to ensure a viable wild tiger population and preserve natural tiger habitats through protected tiger reserves.'
    },
    {
      question: 'Why is Dr. Salim Ali widely recognised as the “Birdman of India”?',
      options: {
        A: 'Studied and documented birds',
        B: 'Invented flying machines',
        C: 'Trained birds for shows',
        D: 'Established bird-shaped parks'
      },
      correctAnswer: 'A',
      explanation: 'Dr. Salim Ali was a pioneering Indian ornithologist whose extensive field surveys and bird books popularized ornithology across India.'
    }
  ],

  'Class 5': [
    {
      question: 'Which phase-transition process in the hydrological cycle involves the conversion of surface water into gaseous water vapour through the absorption of solar energy?',
      options: { A: 'Condensation', B: 'Evaporation', C: 'Freezing', D: 'Melting' },
      correctAnswer: 'B',
      explanation: 'Evaporation is the process where solar heat transforms liquid water into water vapour that ascends into the atmosphere.'
    },
    {
      question: 'What is the primary geographical origin of major Indian rivers such as the Ganga?',
      options: {
        A: 'In the sea near the coast',
        B: 'In big lakes on the plains',
        C: 'In deserts, from underground water',
        D: 'In mountain glaciers and springs'
      },
      correctAnswer: 'D',
      explanation: 'The Ganga originates from the Gangotri Glacier (as the Bhagirathi) and high Himalayan snowmelt streams.'
    },
    {
      question: 'Which scientific principle explains the prolonged shelf life of homemade pickles?',
      options: {
        A: 'Salt and oil inhibit microbial growth',
        B: 'Pickles contain no moisture',
        C: 'Refrigeration prevents all spoilage',
        D: 'Spices reduce food temperature'
      },
      correctAnswer: 'A',
      explanation: 'High salt concentration draws moisture out of bacterial cells via osmosis, and oil forms an airtight barrier preventing bacterial and fungal growth.'
    },
    {
      question: 'Which of the following energy sources is naturally replenished and can be utilized sustainably?',
      options: { A: 'Coal', B: 'Petrol', C: 'Sunlight', D: 'Natural gas' },
      correctAnswer: 'C',
      explanation: 'Solar radiation is an inexhaustible, renewable source of energy, unlike finite fossil fuels like coal, petrol, and natural gas.'
    },
    {
      question: 'Which technological device should a school install to convert solar radiation into electrical energy for illuminating its corridors?',
      options: {
        A: 'A diesel generator',
        B: 'A weather vane',
        C: 'A thermometer',
        D: 'Solar panels'
      },
      correctAnswer: 'D',
      explanation: 'Photovoltaic solar panels directly convert sunlight into electricity through semiconductor solar cells.'
    },
    {
      question: 'Looking at these materials, three are made by plants or factories. Which one grows naturally on a living creature?',
      options: { A: 'Cotton', B: 'Jute', C: 'Wool', D: 'Nylon' },
      correctAnswer: 'C',
      explanation: 'Wool is an animal fiber harvested from the fleece of sheep, goats, or yaks; cotton and jute come from plants, and nylon is synthetic.'
    },
    {
      question: 'Which clothes are best for a hot and humid summer day?',
      options: {
        A: 'A thick woollen sweater',
        B: 'Loose cotton clothes',
        C: 'A tight plastic raincoat',
        D: 'A leather jacket'
      },
      correctAnswer: 'B',
      explanation: 'Cotton is lightweight, breathable, and readily absorbs sweat, which cools the body as it evaporates.'
    },
    {
      question: 'The Moon seems to change shape, from one full Moon to the next full Moon. How long does this full cycle take?',
      options: {
        A: 'About a month',
        B: 'About one day',
        C: 'About one week',
        D: 'About one year'
      },
      correctAnswer: 'A',
      explanation: 'A complete lunar cycle of phases (from one Full Moon to the next) takes approximately 29.5 days (about one month).'
    },
    {
      question: 'What is most likely to happen if a large forest is cut down?',
      options: {
        A: 'More rainfall and cleaner air for the area',
        B: 'Soil erosion and animals losing homes',
        C: 'More wild animals living in the area',
        D: 'Cleaner water in the nearby rivers'
      },
      correctAnswer: 'B',
      explanation: 'Deforestation removes tree root systems that bind topsoil leading to severe erosion, and destroys natural wildlife habitats.'
    },
    {
      question: 'Collecting rainwater from rooftops and storing it in tanks, or letting it soak into the ground, is called:',
      options: {
        A: 'Seawater desalination',
        B: 'Flood prevention',
        C: 'Canal irrigation',
        D: 'Rainwater harvesting'
      },
      correctAnswer: 'D',
      explanation: 'Rainwater harvesting collects run-off precipitation from rooftops and catchments for immediate storage or groundwater recharge.'
    },
    {
      question: 'Rohan put one spoon of sugar in a glass of cold water and one spoon in a glass of warm water. He stirred both in the same way. The sugar disappeared faster in the warm water. What can he conclude?',
      options: {
        A: 'Sugar cannot dissolve in cold water',
        B: 'Warm water changes sugar into salt',
        C: 'Sugar dissolves faster in warm water',
        D: 'Stirring stops sugar from dissolving'
      },
      correctAnswer: 'C',
      explanation: 'Higher water temperature increases molecular kinetic energy, causing solute particles to dissolve much more quickly.'
    },
    {
      question: 'On a sunny day, your shadow is shortest around noon. Why?',
      options: {
        A: 'The Sun is high overhead',
        B: 'The Sun is close to the horizon',
        C: 'The Moon is bright at noon',
        D: 'There is less light at noon'
      },
      correctAnswer: 'A',
      explanation: 'When the sun reaches its zenith directly overhead, light rays hit your body from above at a near 90-degree angle, casting minimal horizontal shadow.'
    },
    {
      question: 'Tara wants to find out which cloth soaks up the most water. She tests cotton, nylon and wool. To make it a fair test, what must she keep the same for all three?',
      options: {
        A: 'The type of cloth she tests',
        B: 'Cloth size and amount of water',
        C: 'How much water each cloth soaks up',
        D: 'Her guess about which cloth wins'
      },
      correctAnswer: 'B',
      explanation: 'In a controlled scientific experiment, all control variables (cloth dimensions, starting volume of water, dip time) must remain identical.'
    },
    {
      question: 'India\'s first satellite, launched in 1975, was named after an ancient Indian astronomer and mathematician. What was it called?',
      options: { A: 'Aryabhata', B: 'Chandrayaan', C: 'Mangalyaan', D: 'Gaganyaan' },
      correctAnswer: 'A',
      explanation: 'Aryabhata was launched on April 19, 1975, honoring the 5th-century Indian astronomer and mathematician Aryabhata.'
    },
    {
      question: 'Which action helps most to reduce plastic pollution?',
      options: {
        A: 'Burning plastic bags in the open',
        B: 'Throwing plastic into drains',
        C: 'Carrying a cloth bag for shopping',
        D: 'Using a new plastic bag every time'
      },
      correctAnswer: 'C',
      explanation: 'Using reusable cloth bags reduces the demand for disposable single-use plastic bags, curtailing non-biodegradable waste.'
    }
  ],

  'Class 6': [
    {
      question: 'Where on a standard bar magnet is the magnetic force concentrated to its absolute maximum?',
      options: { A: 'Poles', B: 'Centres', C: 'Edges', D: 'Faces' },
      correctAnswer: 'A',
      explanation: 'Magnetic field lines are most dense at the magnetic poles (North and South), where magnetic attraction and repulsion are strongest.'
    },
    {
      question: 'Which is the star closest to the Earth?',
      options: {
        A: 'The Pole Star (Polaris)',
        B: 'Sirius',
        C: 'The Sun',
        D: 'The Moon'
      },
      correctAnswer: 'C',
      explanation: 'The Sun is our closest star, situated roughly 150 million kilometers from Earth; Proxima Centauri is the next nearest star.'
    },
    {
      question: 'A plant has a tap root. Its leaves are most likely to show:',
      options: {
        A: 'Parallel (straight-line) venation',
        B: 'Reticulate (net-like) venation',
        C: 'No veins at all',
        D: 'Veins only along the edge'
      },
      correctAnswer: 'B',
      explanation: 'Plants with taproot systems typically have dicot leaves featuring reticulate (web-like or net-like) venation.'
    },
    {
      question: 'Which of these shows that a food sample contains starch?',
      options: {
        A: 'Lemon juice turns it red',
        B: 'Salt solution turns it green',
        C: 'Copper sulphate turns it violet',
        D: 'Iodine turns it blue-black'
      },
      correctAnswer: 'D',
      explanation: 'Dilute iodine solution reacts with starch polymers (amylose) to form a characteristic dark blue-black complex.'
    },
    {
      question: 'The normal temperature of a healthy human body is about:',
      options: { A: '27 °C', B: '47 °C', C: '37 °C', D: '100 °C' },
      correctAnswer: 'C',
      explanation: 'Standard human physiological body temperature averages 37 °C (approximately 98.6 °F).'
    },
    {
      question: 'Farmers drop harvested grain from a height so that the wind blows away the lighter husk. This method is called:',
      options: { A: 'Threshing', B: 'Winnowing', C: 'Sieving', D: 'Handpicking' },
      correctAnswer: 'B',
      explanation: 'Winnowing separates heavier grain seeds from lighter chaff/husk by allowing wind or air currents to carry the husk away.'
    },
    {
      question: 'Petrol and diesel come from petroleum, which takes millions of years to form. What is the most sensible thing to do?',
      options: {
        A: 'Use them freely, since they will be replaced soon',
        B: 'Switch to burning more coal instead',
        C: 'Use a car even for very short trips',
        D: 'Use them carefully and choose cleaner options'
      },
      correctAnswer: 'D',
      explanation: 'Fossil fuels are exhaustible, non-renewable resources; conservation and transitioning to renewable green alternatives is essential.'
    },
    {
      question: 'Why is a magnetic compass useful to travellers?',
      options: {
        A: 'Its needle settles pointing north–south',
        B: 'It attracts gold and silver nearby',
        C: 'It measures the distance travelled',
        D: 'It shows the time of day using shadows'
      },
      correctAnswer: 'A',
      explanation: 'The Earth’s geomagnetic field aligns a freely suspended magnetized needle along the North-South geographic axis.'
    },
    {
      question: 'Tiny water droplets form on the outside of a glass filled with ice-cold water. Where does this water come from?',
      options: {
        A: 'Water leaks out through the glass',
        B: 'Water vapour in the air condenses',
        C: 'The ice melts through the glass walls',
        D: 'The glass gives out water like sweat'
      },
      correctAnswer: 'B',
      explanation: 'Warm ambient water vapour loses thermal energy upon contacting the cold glass surface and condenses into liquid droplets.'
    },
    {
      question: 'Priya stirs a spoonful of each substance into a separate glass of water. Which one dissolves completely?',
      options: { A: 'Sand', B: 'Sawdust', C: 'Common salt', D: 'Chalk powder' },
      correctAnswer: 'C',
      explanation: 'Sodium chloride (common salt) is ionic and highly soluble in water, dissolving into sodium and chloride ions to form a clear solution.'
    },
    {
      question: 'Arjun measured the length of his desk as 6 handspans. His teacher measured the same desk as 5 handspans. Why are the two answers different?',
      options: {
        A: 'The desk changed its length overnight',
        B: 'Arjun must have counted the spans wrongly',
        C: 'The teacher used a metre scale',
        D: 'Handspans differ from person to person'
      },
      correctAnswer: 'D',
      explanation: 'Handspans are non-standard units of measurement that vary with individual hand size; standard metric units prevent such discrepancies.'
    },
    {
      question: 'Three sets of seeds were kept in the same room. Set 1 was on dry cotton. Set 2 was on moist cotton. Set 3 was fully covered with water that had been boiled and cooled. Only Set 2 germinated. The seeds in Set 3 did not germinate mainly because they did not get enough:',
      options: { A: 'Water', B: 'Air', C: 'Soil', D: 'Sunlight' },
      correctAnswer: 'B',
      explanation: 'Boiling water expels dissolved oxygen (air); seeds submerged in boiled water suffocate because respiration is essential for germination.'
    },
    {
      question: 'Equal amounts of water at 20 °C and at 60 °C are mixed in one container. What will the temperature of the mixture be?',
      options: { A: 'About 10 °C', B: 'About 20 °C', C: 'About 40 °C', D: 'About 80 °C' },
      correctAnswer: 'C',
      explanation: 'When equal masses of the same liquid at different temperatures are mixed without heat loss, the equilibrium temperature is the arithmetic mean: (20 + 60) / 2 = 40 °C.'
    },
    {
      question: 'India\'s first Dark Sky Reserve, set up to protect clear night skies for astronomy, is located at:',
      options: {
        A: 'Hanle, Ladakh',
        B: 'Sriharikota, Andhra Pradesh',
        C: 'Thumba, Kerala',
        D: 'Bengaluru, Karnataka'
      },
      correctAnswer: 'A',
      explanation: 'The Indian Astronomical Observatory at Hanle in Eastern Ladakh is India\'s first designated Dark Sky Reserve due to its high altitude and pristine night skies.'
    },
    {
      question: 'On India\'s proposal, the United Nations declared 2023 the International Year of Millets. Why are millets such as ragi and bajra valued?',
      options: {
        A: 'They grow only in snowy mountain places',
        B: 'They need much more water than rice',
        C: 'They have no nutrients but taste good',
        D: 'They are nutritious and need less water'
      },
      correctAnswer: 'D',
      explanation: 'Millets are climate-resilient nutri-cereals that require substantially less water and inputs than rice and wheat while being rich in minerals and dietary fiber.'
    }
  ],

  'Class 7': [
    {
      question: 'A mystery solution triggers a color change that converts blue litmus paper to red. This substance must be:',
      options: { A: 'Basic', B: 'Neutral', C: 'A metal', D: 'Acidic' },
      correctAnswer: 'D',
      explanation: 'Acids turn blue litmus red, whereas bases turn red litmus blue.'
    },
    {
      question: 'The property that allows metals to be beaten into thin sheets is called:',
      options: { A: 'Ductility', B: 'Sonority', C: 'Malleability', D: 'Lustre' },
      correctAnswer: 'C',
      explanation: 'Malleability is the physical property of metals enabling them to be hammered or rolled into thin sheets without shattering.'
    },
    {
      question: 'Which gas do green plants take in from the air to make food by photosynthesis?',
      options: { A: 'Oxygen', B: 'Nitrogen', C: 'Carbon dioxide', D: 'Sulphur dioxide' },
      correctAnswer: 'C',
      explanation: 'Green plants absorb carbon dioxide (CO2) through stomata and combine it with water in the presence of sunlight to produce glucose and oxygen.'
    },
    {
      question: 'In the human digestive system, most digestion and absorption of food takes place in the:',
      options: {
        A: 'Stomach',
        B: 'Small intestine',
        C: 'Large intestine',
        D: 'Food pipe (oesophagus)'
      },
      correctAnswer: 'B',
      explanation: 'The small intestine has millions of microvilli that provide an immense surface area for chemical digestion and nutrient absorption into the bloodstream.'
    },
    {
      question: 'A solar eclipse happens when:',
      options: {
        A: 'The Moon comes between the Sun and the Earth',
        B: 'The Earth comes between the Sun and the Moon',
        C: 'The Sun comes between the Earth and the Moon',
        D: 'Clouds cover the Sun for a whole day'
      },
      correctAnswer: 'A',
      explanation: 'A solar eclipse occurs when the Moon passes directly between the Sun and Earth, casting its shadow onto Earth’s surface.'
    },
    {
      question: 'A steel spoon and a wooden spoon have been lying in the same room for hours. When you touch them, the steel spoon feels colder. Why?',
      options: {
        A: 'The steel spoon is at a lower temperature',
        B: 'The wooden spoon makes its own heat',
        C: 'Steel draws heat from your hand faster',
        D: 'Cold air sticks to the surface of steel'
      },
      correctAnswer: 'C',
      explanation: 'Both spoons are at the same room temperature, but steel is a high thermal conductor that conducts heat away from your fingertips much faster than wood.'
    },
    {
      question: 'An ant bite injects an acid into the skin. Which of these, rubbed gently on the bite, can give relief?',
      options: {
        A: 'Fresh lemon juice',
        B: 'Diluted vinegar',
        C: 'Tamarind water',
        D: 'Baking soda paste'
      },
      correctAnswer: 'D',
      explanation: 'Ant stings inject formic (methanoic) acid; applying mild sodium bicarbonate (baking soda paste) chemically neutralizes the acid.'
    },
    {
      question: 'Adolescents grow quickly and need more iron in their diet. Which food choice best supports this?',
      options: {
        A: 'Spinach, jaggery and pulses',
        B: 'Plain white rice only',
        C: 'Cucumber and lettuce only',
        D: 'Butter and cream'
      },
      correctAnswer: 'A',
      explanation: 'Spinach, jaggery, and legumes/pulses are rich dietary sources of bioavailable iron needed for hemoglobin synthesis and rapid adolescent development.'
    },
    {
      question: 'Rohit\'s family paints their iron gate regularly. This mainly protects the gate from:',
      options: { A: 'Melting', B: 'Rusting', C: 'Evaporation', D: 'Magnetism' },
      correctAnswer: 'B',
      explanation: 'Paint forms an impermeable physical barrier that keeps moisture (water) and atmospheric oxygen away from iron, preventing rust (iron oxide) formation.'
    },
    {
      question: 'On a sunny afternoon at the beach, a cool breeze blows from the sea towards the land. Why?',
      options: {
        A: 'The sea heats up faster, so air rises over the sea',
        B: 'Waves push the air from the sea onto the land',
        C: 'The land cools faster, so air sinks over the land',
        D: 'The land heats up faster, so warm air over it rises'
      },
      correctAnswer: 'D',
      explanation: 'Land has a lower specific heat capacity than water and heats up faster; rising warm air over land draws in cooler, denser air from above the sea (sea breeze).'
    },
    {
      question: 'A cyclist covers 120 metres in 20 seconds at a steady speed. What is her speed?',
      options: { A: '0.17 m/s', B: '6 m/s', C: '100 m/s', D: '2,400 m/s' },
      correctAnswer: 'B',
      explanation: 'Speed = Distance / Time = 120 m / 20 s = 6 m/s.'
    },
    {
      question: 'You stand in front of a plane mirror and raise your right hand. Your image appears to raise its:',
      options: { A: 'Left hand', B: 'Right hand', C: 'Both hands', D: 'Neither hand' },
      correctAnswer: 'A',
      explanation: 'Images formed by plane mirrors undergo lateral inversion, where the right side of the object appears as the left side of the virtual image.'
    },
    {
      question: 'Asha covered only the leafy shoot of a potted plant with a clear plastic bag and tied it around the stem, so the soil stayed outside. She kept the plant in sunlight. After a few hours, water droplets appeared inside the bag. What does this show?',
      options: {
        A: 'Plastic gives off water in sunlight',
        B: 'Water from the soil leaked into the bag',
        C: 'Leaves take in water from the air',
        D: 'Leaves give out water vapour'
      },
      correctAnswer: 'D',
      explanation: 'Transpiration is the process by which plants release excess water as vapour through leaf stomata, which then condenses on the plastic interior.'
    },
    {
      question: 'India celebrates National Science Day on 28 February to mark C.V. Raman\'s discovery of the Raman Effect. The Raman Effect is about:',
      options: {
        A: 'The rusting of iron',
        B: 'The scattering of light',
        C: 'The flow of electric current',
        D: 'The movement of ocean tides'
      },
      correctAnswer: 'B',
      explanation: 'The Raman Effect, discovered by Sir C.V. Raman in 1928 (Nobel Prize 1930), demonstrates the inelastic scattering of photons by molecular matter.'
    },
    {
      question: 'Which of these is the best way to save electricity at home?',
      options: {
        A: 'Keep the fridge door open for longer',
        B: 'Leave phone chargers switched on all day',
        C: 'Use LED bulbs and turn off unused lights',
        D: 'Use old filament bulbs instead of LEDs'
      },
      correctAnswer: 'C',
      explanation: 'LEDs use up to 80% less power than incandescent filament bulbs and switching off idle lights cuts wasteful electrical consumption.'
    }
  ],

  'Class 8': [
    {
      question: 'A spoonful of curd is added to warm milk. By the next morning, the milk has set into curd. What causes this?',
      options: {
        A: 'Yeast in the curd gives off carbon dioxide',
        B: 'Bacteria make lactic acid from milk sugar',
        C: 'The warm milk slowly cools and thickens',
        D: 'Air dissolves in the milk and hardens it'
      },
      correctAnswer: 'B',
      explanation: 'Lactobacillus bacteria present in the starter inoculate the milk, fermenting lactose sugar into lactic acid which curdles milk proteins into curd.'
    },
    {
      question: 'Which of these is a non-contact force?',
      options: {
        A: 'Friction',
        B: 'Muscular force',
        C: 'The force of a bat hitting a ball',
        D: 'Gravitational force'
      },
      correctAnswer: 'D',
      explanation: 'Gravity exerts an attractive pull between masses across empty space without requiring physical contact.'
    },
    {
      question: 'Which of these is a compound?',
      options: { A: 'Water', B: 'Oxygen', C: 'Air', D: 'Iron' },
      correctAnswer: 'A',
      explanation: 'Water (H2O) is a chemical compound formed by chemically bonded hydrogen and oxygen atoms in a fixed 2:1 ratio.'
    },
    {
      question: 'Pressure is defined as:',
      options: {
        A: 'Force multiplied by area',
        B: 'Area divided by force',
        C: 'Force acting per unit area',
        D: 'Mass multiplied by speed'
      },
      correctAnswer: 'C',
      explanation: 'Pressure is quantified as the perpendicular force exerted per unit area (P = F / A), measured in Pascals (N/m²).'
    },
    {
      question: 'The ozone layer high in the atmosphere protects life on Earth by:',
      options: {
        A: 'Producing clouds that bring rain',
        B: 'Supplying carbon dioxide to plants',
        C: 'Absorbing harmful ultraviolet rays',
        D: 'Keeping the Earth\'s inner core hot'
      },
      correctAnswer: 'C',
      explanation: 'The stratospheric ozone (O3) layer shields the biosphere by absorbing dangerous solar ultraviolet (UV-B and UV-C) radiation.'
    },
    {
      question: 'Vehicles use a rear-view mirror that gives the driver a wider view of the traffic behind. Which type is it?',
      options: {
        A: 'Convex mirror',
        B: 'Concave mirror',
        C: 'Concave lens',
        D: 'Plane mirror'
      },
      correctAnswer: 'A',
      explanation: 'Convex mirrors always form diminished, virtual, and erect images, providing an expanded field of view behind the vehicle.'
    },
    {
      question: 'A sharp knife cuts vegetables more easily than a blunt one. Why?',
      options: {
        A: 'Its sharp edge makes vegetables lighter',
        B: 'Its thin edge spreads the force wider',
        C: 'A sharp knife is heavier than a blunt one',
        D: 'Its thin edge gives more pressure'
      },
      correctAnswer: 'D',
      explanation: 'Because Pressure = Force / Area, the razor-thin contact area of a sharp edge generates significantly higher pressure for the same applied force.'
    },
    {
      question: 'Cranes in scrapyards lift iron scrap with electromagnets rather than permanent magnets. Why?',
      options: {
        A: 'Electromagnets also pick up plastic and glass',
        B: 'They can be switched off to drop the scrap',
        C: 'Permanent magnets cannot attract iron at all',
        D: 'Electromagnets work without any electricity'
      },
      correctAnswer: 'B',
      explanation: 'Electromagnetism can be controlled: energizing the coil creates a strong magnetic field to lift heavy scrap, and cutting the current immediately drops it.'
    },
    {
      question: 'Doctors usually do not prescribe antibiotics for a common cold. Why?',
      options: {
        A: 'Antibiotics work only with cold water',
        B: 'Antibiotics do not work on viruses',
        C: 'Colds are caused by bacteria too small to see',
        D: 'Antibiotics turn a cold into a fever'
      },
      correctAnswer: 'B',
      explanation: 'The common cold is caused by viruses (such as rhinoviruses), and antibiotics target bacterial structures and are ineffective against viral infections.'
    },
    {
      question: 'Some sugar stays undissolved at the bottom of a glass of water, even after stirring. How can you make more of it dissolve?',
      options: {
        A: 'Cool the water in a refrigerator',
        B: 'Add more sugar at once',
        C: 'Warm the water while stirring',
        D: 'Leave it undisturbed for an hour'
      },
      correctAnswer: 'C',
      explanation: 'Heating increases water\'s solubility limit and kinetic agitation, allowing additional solute to dissolve into an otherwise saturated solution.'
    },
    {
      question: 'A drop of ink is gently placed in a glass of still water. After some time, the colour spreads through the water without any stirring. This shows that:',
      options: {
        A: 'Particles keep moving and have spaces',
        B: 'Ink particles are heavier than water particles',
        C: 'Water particles do not move at all',
        D: 'The ink slowly changes into water'
      },
      correctAnswer: 'A',
      explanation: 'Diffusion occurs because matter is particulate, in continuous random Brownian motion, and particles intermingle through intermolecular spaces.'
    },
    {
      question: 'In a pond, frogs eat insects and snakes eat frogs. If all the frogs were removed, the number of insects would most likely:',
      options: {
        A: 'Decrease sharply',
        B: 'Become zero',
        C: 'Stay exactly the same',
        D: 'Increase'
      },
      correctAnswer: 'D',
      explanation: 'Eliminating the secondary consumer (frogs) removes predator pressure on the primary consumer (insects), causing insect populations to surge.'
    },
    {
      question: 'A full Moon was seen on 1 March. Around when will the next full Moon be seen?',
      options: {
        A: 'Around 8 March',
        B: 'Around 15 March',
        C: 'Around 1 June',
        D: 'Around 30 March'
      },
      correctAnswer: 'D',
      explanation: 'The synodic month (lunar phase cycle) is approximately 29.5 days; thus the subsequent Full Moon appears around March 30.'
    },
    {
      question: 'The ancient Indian thinker Acharya Kanad proposed that all matter is made of tiny, indivisible particles. What did he call them?',
      options: { A: 'Parmanu', B: 'Prana', C: 'Akasha', D: 'Agni' },
      correctAnswer: 'A',
      explanation: 'Around 600 BCE, philosopher Acharya Kanad conceptualized that matter consists of indivisible, indestructible fundamental units termed \'Parmanu\'.'
    },
    {
      question: 'UNESCO\'s 2026 World Science Day theme is about science diplomacy. Which is the best example of countries finding common ground through science?',
      options: {
        A: 'A country hiding cyclone warnings from its neighbours',
        B: 'Many nations jointly building the ITER fusion project',
        C: 'Two countries racing to cut down a shared forest',
        D: 'Scientists being stopped from attending global meetings'
      },
      correctAnswer: 'B',
      explanation: 'Megascience projects like the ITER experimental fusion reactor unite dozens of nations in collaborative scientific research for peaceful, clean energy.'
    }
  ]
};

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully.');

    // 1. Ensure 'Science' Subject exists
    let scienceSubject = await Subject.findOne({ name: 'Science' });
    if (!scienceSubject) {
      scienceSubject = await Subject.create({ name: 'Science' });
      console.log('Created Science Subject with ID:', scienceSubject._id);
    } else {
      console.log('Found existing Science Subject ID:', scienceSubject._id);
    }

    const classes = ['Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8'];
    let totalQuestionsInserted = 0;
    let totalQuizzesConfigured = 0;

    // Check for the existing placeholder quiz
    const existingPlaceholder = await Quiz.findOne({
      $or: [
        { _id: '6ad626e028f595f72f431090' },
        { scheduleBatchId: BATCH_ID, targetClass: 'All' },
        { name: 'World Science Day' }
      ]
    });

    for (let i = 0; i < classes.length; i++) {
      const className = classes[i];
      const isRepresentative = (i === 0); // Class 3 represents the batch on the public portal
      const isFeaturedOnPortal = isRepresentative;
      const questions = quizDataByClass[className];

      let quiz = null;

      if (isRepresentative && existingPlaceholder) {
        // Reuse the existing placeholder quiz document for Class 3
        quiz = existingPlaceholder;
        console.log(`Reusing existing document ${quiz._id} for ${className}`);
      } else {
        // Find existing quiz for this batch and class, or create new
        quiz = await Quiz.findOne({
          scheduleBatchId: BATCH_ID,
          targetClass: className
        });
      }

      const quizFields = {
        name: `World Science Day Quiz 2026 - ${className}`,
        subjectId: scienceSubject._id,
        targetClass: className,
        classes: [className],
        numberOfQuestions: questions.length,
        totalScore: questions.length,
        timePerQuestion: 40,
        passingPercentage: 50,
        status: 'Published',
        description: 'Celebrate World Science Day 2026 with an inspiring science quiz exploring biology, physics, chemistry, astronomy, nature, and scientific discovery.',
        instructions: '15 Multiple Choice Questions. 40 Seconds per question. Language of the quiz – English.',
        contactInfo: '+91 92174 78822',
        language: 'en',
        startDate: START_DATE,
        endDate: END_DATE,
        timing: TIMING,
        durationMinutes: 60,
        bannerUrl: BANNER_URL,
        scheduleBatchId: BATCH_ID,
        batchName: BATCH_NAME,
        isRepresentative: isRepresentative,
        isFeaturedOnPortal: isFeaturedOnPortal,
        showTiming: true,
        scheduleStatus: 'Upcoming'
      };

      if (!quiz) {
        quiz = await Quiz.create(quizFields);
        console.log(`Created new Quiz for ${className} with ID: ${quiz._id}`);
      } else {
        Object.assign(quiz, quizFields);
        await quiz.save();
        console.log(`Updated Quiz for ${className} with ID: ${quiz._id}`);
      }

      totalQuizzesConfigured++;

      // Delete old questions for this quiz
      const delResult = await Question.deleteMany({ quizId: quiz._id });
      console.log(`  Deleted ${delResult.deletedCount} old questions for ${className}`);

      // Insert new questions
      const questionDocs = questions.map((q, idx) => ({
        quizId: quiz._id,
        subjectId: scienceSubject._id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation
      }));

      const inserted = await Question.insertMany(questionDocs);
      console.log(`  ✅ Inserted ${inserted.length} questions for ${className}.`);
      totalQuestionsInserted += inserted.length;
    }

    console.log('\n======================================================');
    console.log('🎉 WORLD SCIENCE DAY 2026 QUIZZES & QUESTIONS SEEDED!');
    console.log(`Total Quizzes Configured: ${totalQuizzesConfigured}`);
    console.log(`Total Questions Inserted: ${totalQuestionsInserted}`);
    console.log('======================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
