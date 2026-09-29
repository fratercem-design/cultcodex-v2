// The Ten Mahāvidyās — book text.
//
// An original retelling in plain English, drawn from the Daśa Mahāvidyā
// series by Shri Ravi on manblunder.com (September 2014 – January 2015).
// Nothing here is copied from that series; ideas, stories and symbolism are
// retold and credited. Full mantras are deliberately left out: the source
// stresses receiving them through initiation, and publishes them itself.
//
// Paragraph strings are HTML (only <em> and <strong> are used).

export const BOOK = {
  title: "The Ten Mahāvidyās",
  subtitle: "Ten Faces of the One Goddess",
  devanagari: "दश महाविद्या",
  imprint: "Cult of Psyche",
  sourceName: "the Daśa Mahāvidyā series by Shri Ravi",
  sourceSite: "manblunder.com",
  sourceUrl: "https://manblunder.com/articles/dasa-mahavidya",
  sourceDates: "September 2014 – January 2015",
};

export const FRONT = {
  note: [
    "This book retells, in plain English, what the teacher Shri Ravi set out in his fourteen-part series on the Daśa Mahāvidyā, published on manblunder.com between September 2014 and January 2015. The stories, symbols and teachings are his account of the tradition. The wording here is new, and any mistakes in it are ours.",
    "His series also gives the mantras of each goddess, many of them in several versions. They are not reproduced here. The tradition he writes from holds that a mantra works when it is received from a teacher, not copied from a page, and his own articles are the right place to read them in full. Where a seed syllable (<em>bīja</em>) helps explain a goddess, it is discussed for what it means, not given as a practice.",
    "Sanskrit terms are written with their diacritics the first time they appear. A glossary at the back collects them.",
  ],
};

export const INTRO = {
  title: "Before the Ten",
  sections: [
    {
      heading: "Light and the knowing of light",
      paras: [
        "A hymn to the Mother puts it simply: sages describe her visible forms, the Vedas describe her subtle forms as sound, some call her the source of speech and some the root of the worlds, but the devotee knows her only as an ocean of compassion. Worship of Śakti starts there, with a relationship before a theory.",
        "The theory is still worth having. In this tradition Śiva is <em>prakāśa</em>, light that shines by itself. Śakti is <em>vimarśa</em>, the power by which that light knows itself and becomes a visible world. Light that nothing reflects is as good as darkness, and reflection without a source is impossible. So the two are never apart. Śiva without Śakti is inert, and Śakti has no being apart from Śiva.",
        "In a human being the same pair shows up as the soul and <em>māyā</em>, the veil that makes the soul seem small and separate. The veil is Śakti too. That is why the tradition says Śiva can only be reached through her: she is both the covering and the one who lifts it. At the end of the path she becomes the teacher herself and gives the knowledge of Śiva. One of her names is exactly that, the giver of the knowledge of Śiva.",
      ],
    },
    {
      heading: "What a Mahāvidyā is",
      paras: [
        "<em>Mahāvidyā</em> means great knowledge. The ten Mahāvidyās are ten disciplines, each built around one form of the Goddess, and each is counted as a way toward the knowledge of the Absolute. They are ten faces of one Parāśakti: power, delight, beauty, speech, emptiness, abundance and more, each drawn out and given a shape a person can meditate on.",
        "Shri Ravi is blunt about one misunderstanding. Receiving a Mahāvidyā mantra does not liberate anyone. Every real practice moves a person forward in stages, and liberation comes at the end of that movement, not at the start. <em>Sādhana</em>, the word for practice, means going straight toward a goal and finishing what you start. It begins with outward ritual and matures into the recognition that the body is the temple and the Self inside it is the inner shrine.",
        "He is just as blunt about ego. Some teachers threaten students with dire results for small mistakes or wrap the practice in secrecy, and he calls much of that egotism: how can anything be secret from a Goddess who is everywhere? The first requirement of this path, he says, is to let go of ego, which he calls the worst enemy of any spiritual life.",
      ],
    },
    {
      heading: "Tantra and the four aims of life",
      paras: [
        "Most Mahāvidyā practice belongs to Tantra, and Tantra has a particular view of the world. It does not picture a distant creator ruling from heaven. It treats the practitioner's body as the universe in small, and the power inside that body as the deity to be found.",
        "Indian thought names four aims of a human life: <em>dharma</em> (right living, which Shri Ravi reads as living with the grain of nature), <em>artha</em> (purpose and means), <em>kāma</em> (desire and pleasure) and <em>mokṣa</em> (liberation). The old texts do not forbid the first three. They warn against attachment to them. Tantra goes further and treats desire as the force that moves the universe. Where some schools ask a seeker to renounce desire, Tantra asks the seeker to live it fully and consciously, so that nothing hidden or unfinished is left in the mind to pull it back.",
        "This is easy to misread as permission for excess. Shri Ravi is careful here. Spontaneity, in the tantric sense, means acting from natural feeling without the push of ego. It is the opposite of impulsiveness. Repression keeps the mind circling what it has pushed away, and a mind that circles cannot rest. Overindulgence, on the other hand, is stopped by nature itself. The path runs between the two.",
        "Teachers differ in how they practise. Some follow the right-hand path, some the left-hand path, and some use the five ritual substances that the left-hand schools are known for. The intensity of the practice depends on the lineage. The goal does not.",
      ],
    },
    {
      heading: "How the ten appeared",
      paras: [
        "The Purāṇas tell several versions of where the ten came from. In the best-known one, Satī, Śiva's wife, decides to attend a great sacrifice held by her father Dakṣa, though Śiva has not been invited and does not want her to go. He withdraws from her. Her hurt turns to fury, and the fury blazes in her eyes. Śiva cannot bear to look, and closes his own. When he opens them, a woman of terrible radiance stands in front of him, and he turns to flee.",
        "To keep him from going, she appears in ten forms, one in every direction he could run. When he asks who they are, she names them: Kālī, Tārā, Ṣoḍaśī, Bhuvaneśvarī, Chinnamastā, Tripura Bhairavī, Dhūmāvatī, Bagalāmukhī, Mātaṅgī and Kamalā.",
        "Other texts, the Śiva Purāṇa among them, tell it differently. What the versions share matters more than where they differ. Every one of the ten leads back to the same Parāśakti, the independent power of the Absolute, and only through her grace does anyone merge with Śiva.",
      ],
    },
  ],
};

// ── The ten ─────────────────────────────────────────────────────────────
// `seat` is where the epilogue of the source series places each goddess in
// the subtle body. `reflect` is this book's own closing question, not the
// source's.

export const GODDESSES = [
  {
    n: 1,
    name: "Kālī",
    deva: "काली",
    epithet: "Time that devours time",
    seat: "The heart, both the physical heart and the heart chakra. She also governs the blood.",
    sections: [
      {
        heading: "The name",
        paras: [
          "<em>Kāla</em> can mean Śiva, it can mean time in all its forms including the hour of death, and it can mean black. Each reading gives a face of Kālī. As Śiva's consort she is to Mahākāla what Bhairavī is to Bhairava. As the power over time she is the boundary drawn around the endlessness of Śiva: his vastness is held inside her measure. As darkness she is <em>māyā</em>-power, the dark ground everything else appears against.",
        ],
      },
      {
        heading: "How she came",
        paras: [
          "The Devī Bhāgavata Purāṇa tells how the gods, harried by the demon brothers Śumbha and Niśumbha, went to the Supreme Mother for help. She brought a new power out of her own body and named her Kauśikā. The same text calls this goddess Bhadrakālī, sometimes identified with Durgā, and Kālarātrī, the night of destruction at the end of an age.",
        ],
      },
      {
        heading: "Her form",
        paras: [
          "Descriptions vary, but two things never do: her black skin and her garland of skulls. She is usually shown with four arms. The upper left holds a curved blade and the lower left a severed head. The right hands differ by text: one version gives a cup of blood and the gesture of granting boons, another gives the gestures of fearlessness and of giving. She often stands on a corpse. Her tongue hangs out.",
          "Each detail is a teaching. Her blackness is both death and infinity: death for what must end, eternity as her own nature, because what is beyond time cannot die. The garland holds fifty skulls, one for each letter of the Sanskrit alphabet. Skulls stand for every being, because every life ends the same way. Her skirt of severed arms is the karma she cuts away from anyone who surrenders to her. The protruding tongue shows that she takes in what is foul and gives back only what is pure.",
          "The blade and the head carry the central lesson. The blade is her grace. The head is the ego. When she gives grace, the first thing she takes is the sense of being the doer, which an old text defines as the whole of ego. Nothing else in the spiritual life can be sorted out until that goes.",
          "The body under her feet is Śiva. Without Śakti, the Saundaryalaharī says, Śiva cannot so much as stir. Kālī and Mahākāla live in the cremation ground, which is where every life ends whatever its rank. One of her names is simply the one who dwells in the cremation ground.",
        ],
      },
      {
        heading: "What she teaches",
        paras: [
          "Her hymn of a hundred and eight names calls her terrible in form and kind in intent, an ocean of compassion without limit, the liberator, the queen of Benares, the one who removes fear from those who come to her. The frightening image and the compassion are the same thing. She is frightening to the part of us that wants to stay the same, and compassionate to everything else.",
        ],
      },
      {
        heading: "Seed syllables",
        paras: [
          "Her own seed is <em>krīṁ</em>. The hymn says she is made of three seeds, <em>krīṁ hrīṁ śrīṁ</em>, and a note in the series explains them: <em>krīṁ</em> is Kalyāṇī, the auspicious one; <em>hrīṁ</em> is Kālī; <em>śrīṁ</em> is Karālī, the dreadful one. Her best-known mantra is that of Dakṣiṇa Kālī, which the series gives in full along with several variants.",
        ],
      },
    ],
    reflect: "What in you insists on being the doer, and what would be left if it stepped aside?",
  },
  {
    n: 2,
    name: "Tārā",
    deva: "तारा",
    epithet: "The one who carries across",
    seat: "The tongue, the navel chakra, and upward as far as the space between the eyebrows.",
    sections: [
      {
        heading: "The name",
        paras: [
          "<em>Tāra</em> means saviour or protector, the one who carries you across. It also means shining, and it is the name of a mystic syllable like <em>oṁ</em>. Tārā is one of the few Mahāvidyās honoured in Buddhism and Jainism as well.",
        ],
      },
      {
        heading: "How she came",
        paras: [
          "When the gods churned the ocean of milk, it gave up both nectar and a deadly poison. Everyone fled from the poison except Śiva, who stayed calm and drank it. For that calm he is called Akṣobhya, the unshaken. As he swallowed, Pārvatī held his throat so the poison would go no further, and it stayed there and turned his throat blue.",
          "The story divides the credit. The power to stay unshaken came from Tārā. The power to swallow the poison came from Pārvatī. That is how Tārā is first known: as the steadiness that lets you face what would destroy you.",
          "She has other forms, among them Ugra Tārā, Nīla Sarasvatī and Ekajaṭā. She is the first sound from which speech arises, and she governs the emotions. A line of her hymn puts it compactly: she is <em>nāda</em>, the resonance, and Śiva is <em>bindu</em>, the point.",
        ],
      },
      {
        heading: "Her form",
        paras: [
          "She looks much like Kālī, but without the lolling tongue and the severed head. Her left hands hold a blade and scissors; her right hands hold a lotus and grant boons. She wears a garland of skulls and stands on a corpse.",
          "One meditation verse sees her with three eyes, dressed in white, bright as the moon, with a crescent in her hair, holding lotuses, a blade and a skull. Three others give her three larger forms, one for each cosmic act. For creation she sits on a swan with four faces and eight arms. For preservation she sits on a red throne on the White Island where freed souls live. For dissolution she rides a boat on an ocean of blood, dressed in black and ornamented with bone, with nine faces and eighteen arms.",
        ],
      },
      {
        heading: "What she teaches",
        paras: [
          "Tārā is said to be the easiest of the ten to reach, and she comes with no fixed rules of worship. The best approach, the series says, is to keep her in view all the time. She protects against fear in all its forms, from wild animals and water to phantoms, and gives knowledge both worldly and spiritual.",
          "There is one condition, and it is strict. Whoever works with her mantra must never tell a lie, under any circumstances. It fits: a goddess of speech asks first for truthful speech.",
        ],
      },
      {
        heading: "Seed syllables",
        paras: [
          "Her mantra carries a story. The sage Vasiṣṭha repeated it for a long time without her appearing, and in anger he cursed it, and it went dead. When his anger cooled, he lifted the curse by changing one seed, <em>trīṁ</em>, to <em>strīṁ</em>, and from then on the mantra bore fruit. The series gives the corrected mantra, eight more by which Brahmā and Viṣṇu are said to have worshipped her, and the mantras of Ekajaṭā and Nīla Sarasvatī.",
        ],
      },
    ],
    reflect: "Where would one unbroken week of plain truth-telling change your life?",
  },
  {
    n: 3,
    name: "Tripurasundarī",
    deva: "त्रिपुरसुन्दरी",
    epithet: "Beauty of the three worlds",
    seat: "The crown of the head (sahasrāra).",
    sections: [
      {
        heading: "The name",
        paras: [
          "The third Mahāvidyā is the heart of the whole tradition called Śrī Vidyā, and her worship is an ocean with many lineages. She is also called Ṣoḍaśī, the sixteen-year-old, and in other forms Bālā and Lalitāmbikā. <em>Pura</em> means city; <em>tripura</em> means three cities. The oldest reference is in the Śrī Rudram, which praises Śiva as the destroyer of three cities held by demons. She is his consort, and <em>sundarī</em> means beautiful.",
          "The Lalitā Sahasranāma reads the name more widely. She is every triad there is: Brahmā, Viṣṇu and Rudra; will, knowledge and action; creation, preservation and dissolution; the three channels of the subtle body; the three worlds; the three qualities of nature. Go beyond every triad, and what remains is the Absolute.",
        ],
      },
      {
        heading: "The Śrī Cakra",
        paras: [
          "She is worshipped in the Śrī Cakra, a diagram of nine interlocking triangles: four pointing up, which belong to Śiva, and five pointing down, which belong to Śakti. Together they make forty-three smaller triangles around a central point. With eight triangles the figure would be static; the ninth makes it dynamic, which suits the home of the Goddess of movement. Built upward in three dimensions, the same figure is called the Mahā Meru, the great mountain, with the point at the summit.",
          "The figure maps onto the body. The Śakti triangles stand for the gross elements and senses; the Śiva triangles stand for mind, intellect, individual consciousness and ego. Life only begins where the gross and the subtle meet. The central point, the <em>bindu</em>, is the seed of the universe, and the region around it is called all-blissful because there Śiva and Śakti are united.",
          "Her worship moves through the diagram from the outside in, through nine enclosures, each with its own goddesses, until it reaches the point. The series does not suggest trying this alone. The right to worship the Śrī Cakra comes only with initiation, and Śrī Vidyā gives the teacher very great weight. Its aim is to see no difference at all between the teacher, the mantra and the Goddess. When that triad dissolves, she reveals herself, and from then on she is the teacher.",
        ],
      },
      {
        heading: "Looking within",
        paras: [
          "Two of her thousand names say when that happens. She is worshipped by those who look within. She is almost impossible to reach for those who look only outward. Senses that run everywhere take the mind with them; a mind that is always outside cannot find what is inside. The Saundaryalaharī says the same: she is hard to reach for anyone who has not reined in the senses. Addiction and need are different things, the series adds. Needs are not the problem.",
        ],
      },
      {
        heading: "The fifteen and the sixteen",
        paras: [
          "Her main mantra is the Pañcadaśī, the fifteen-syllable. Its seeds are arranged in three groups: five, then six, then four, each ending in <em>hrīṁ</em>. The groups map onto her body (the face, then neck to hip, then hip to feet), onto creation, preservation and dissolution, and onto fire, sun and moon. Joined together they form a downward triangle, the source of the universe, which is one reason the mantra is treated as especially sacred. It is traditionally encoded in a Sanskrit verse rather than spelled out, and each group has its own length of breath and its own path through the chakras.",
          "The Ṣoḍaśī, the sixteen-syllable, takes the Pañcadaśī and encloses it between two lines of powerful seeds, the second line mirroring the first in reverse. It is usually given only after the student has worked with Bālā and then the Pañcadaśī, and only when the teacher judges the student ready. The Pañcadaśī is said to take a practitioner as far as <em>turīya</em>, the fourth state beyond waking, dream and deep sleep. The Ṣoḍaśī is said to take the practitioner beyond it, to merging with the Absolute. The series describes that moment as happening in a fraction of a second, something like dying, after which the person is not the same.",
          "At the centre of the Ṣoḍaśī is the seed <em>sauḥ</em>, called the supreme seed or the heart seed. The series traces it to a dialogue in which Śiva explains it to Śakti: <em>s</em> for pure being, <em>au</em> for his three powers of will, knowledge and action, and the final breath for the pulse of creation. It is meant less for repeating than for contemplating. Whoever fully understands it, the text says, is freed.",
        ],
      },
      {
        heading: "The journey to the centre",
        paras: [
          "The series tells the last stage of her worship as a story. At the innermost enclosure, the seeker who has been resting in her lap is told it is time to go on. She rises from her throne, takes the seeker by the hand and enters the central point, which is full of blinding light. The white light turns red, and Śiva appears, crystal-clear and radiant. She sits beside him, then slowly moves toward him until the two are one. The seeker, still on her lap, goes with her. That, the series says, is liberation: a mother placing her child's hand in the father's.",
        ],
      },
      {
        heading: "Seated on five",
        paras: [
          "One of her names describes her seated on a throne held up by five corpses: Brahmā, Viṣṇu, Rudra, Mahādeva and Sadāśiva, the lords of creation, preservation, destruction, concealment and grace. Without her they cannot act. The next name finishes the thought: she is those five acts of the Absolute. The gods, in this reading, are ways of naming what nature does, and nature is called Mother because every act of the Absolute unfolds through her.",
        ],
      },
    ],
    reflect: "What do you keep looking for outside that you have never once looked for inside?",
  },
  {
    n: 4,
    name: "Bhuvaneśvarī",
    deva: "भुवनेश्वरी",
    epithet: "Queen of the worlds, and the space they hang in",
    seat: "The space in the heart where the soul lives. The Kaṭha Upaniṣad calls it a cave in the heart.",
    sections: [
      {
        heading: "The name",
        paras: [
          "<em>Bhuvana</em> means the worlds, all fourteen of them, seven below and seven above counting the earth. Bhuvaneśvara, lord of the worlds, is Śiva, and Bhuvaneśvarī is his consort and their ruler. She stands for <em>ākāśa</em>, space. The Taittirīya Upaniṣad names space as the first thing to come from the Self: from space came air, then fire, water, earth, plants, food and finally people. If space comes first, she is the ground of creation.",
          "She is linked with Aditi, one of the oldest goddesses of the Ṛg Veda, whose name means boundlessness, abundance and unbroken wholeness, mother of the gods. Her posture sets her apart from Lalitā: she does not sit on Śiva's lap, and her right leg hangs down where Lalitā's left does.",
        ],
      },
      {
        heading: "Māyā, the measure",
        paras: [
          "As the cause of creation she is also <em>māyā</em>. The root <em>mā</em> means to measure. The Absolute cannot be measured, but under māyā it seems to be, as if bound by time and space. Māyā is neither real nor unreal. It is the principle by which things appear, a veil laid over the Absolute in every being. Knowledge removes the veil; ignorance keeps it in place.",
          "That is why the tradition gives Śakti worship such weight. Śiva is the Absolute, Śakti is māyā, and only the one who wove the veil can draw it back. She does that when the impurities of the physical, subtle and causal bodies are gone. In the Bhagavad Gītā, Kṛṣṇa says his māyā is very hard to cross, and that those who keep turning to him cross it.",
        ],
      },
      {
        heading: "The seed hrīṁ",
        paras: [
          "Her seed is <em>hrīṁ</em>, called the māyā seed and the praṇava of Śakti, as powerful for her worshippers as <em>oṁ</em>. Every group of the Pañcadaśī ends with it. The series takes it apart letter by letter. <em>Ha</em> is manifestation and the seed of Śiva. <em>Ra</em> is involution, the folding-in of māyā, and the chief of sounds. <em>Ī</em> is perfection, and as <em>īṁ</em> it is the seed of Śakti. The dot above, the <em>bindu</em>, rules all three. Read together: a form wrapped in perfection, and a veil that lifts once the power of Śakti is fully known. Because it joins Śiva's letter and Śakti's letter through fire, it can also be called the Śiva-Śakti seed.",
          "The series follows the dot on a long path upward, from the heart through the throat and palate to the forehead, out into cosmic emptiness and back as light. The lesson is shorter than the path. Without the dot a letter is only a letter. With it, the letter becomes a seed.",
        ],
      },
      {
        heading: "Her form",
        paras: [
          "She has four arms. Most descriptions give her a goad and a noose, like Lalitā, along with the gesture that removes fear. The fourth hand holds a chisel, for cutting away wrongdoing, or else grants boons. Her short mantras are the single seed <em>hrīṁ</em> and a three-seed form in which <em>hrīṁ</em> sits between the seeds of Sarasvatī and Lakṣmī.",
        ],
      },
    ],
    reflect: "What would change if you treated the space around things as seriously as the things?",
  },
  {
    n: 5,
    name: "Chinnamastā",
    deva: "छिन्नमस्ता",
    epithet: "The self-beheaded",
    seat: "The space between the eyebrows (ājñā). She governs the upward movement of prāṇa.",
    sections: [
      {
        heading: "The image",
        paras: [
          "<em>Chinna</em> means cut; <em>mastā</em> means head. Of the ten, her image is the hardest to look at, and the series opens its chapter with a word of caution. She holds her own severed head in her left hand. Three streams of blood rise from her neck. The middle stream falls into her own mouth; the other two feed her attendants, Ḍākinī and Varṇinī, who stand on either side. She is naked, but no one can see her that way, because she sits inside the disc of the sun and outshines it. Often she stands with one foot on Kāma and Rati, the god of desire and his wife, lying joined beneath her. In Buddhism she is known as Chinnamuṇḍā and Vajrayoginī.",
        ],
      },
      {
        heading: "Two stories",
        paras: [
          "In the first, Pārvatī goes to bathe in a river with her two companions, Jayā and Vijayā, and becomes absorbed in longing for Śiva. The companions grow hungry and ask for food, again and again, and she does not hear them. At last they remind her that feeding them is her duty. She comes to herself, cuts off her own head with her fingernails, and three streams of blood rise: one to each companion, one to herself. The side streams are the channels <em>iḍā</em> and <em>piṅgalā</em>; the centre is <em>suṣumnā</em>.",
          "In the second, the companions are born during the union of Śiva and Caṇḍikā, and the story goes on to the birth of Krodha Bhairava. In the first story Śiva is the stronger; in the second, the Goddess. The series draws the conclusion that the two are equal, and which one leads depends on the moment.",
        ],
      },
      {
        heading: "What she teaches",
        paras: [
          "The first lesson is surrender. The companions ask and are ignored. Only when they give up everything but her does she answer, and she answers with her own life. One of her names in the Lalitā Sahasranāma is the one who frees from bondage, and the Saundaryalaharī gives a way to surrender: let my speech be your mantra, my gestures your mudrās, my walking your circling, my eating your offering, my lying down my bow to you.",
          "The second lesson is about the subtle body. When <em>kuṇḍalinī</em> rises through the central channel, the two side channels are still active, in different measure. All three streams flow at once.",
          "The third lesson unsettles people. Her story begins in desire, and the series takes that at face value: married love is part of her worship, and celibacy is not required. Kuṇḍalinī can rise in union. The spiritual world does not sit outside the material one, any more than the mind sits outside the body. The same texts set limits on excess, and she stands on Kāma and Rati to show that desire is hers to govern, not the other way round.",
          "Some call her a lesser or dangerous deity because of her nakedness, her severed head and her passion, and some say she can only be approached on the left-hand path. The series answers that none of this matters to someone who has seen through form. What matters is consciousness. When the mind is clean, consciousness leaves the body through the crown, the sense of two collapses, and Śiva is found everywhere. Her drinking of her own blood is that absorption. She is also a witness of the great dissolution.",
          "The last lesson is the plainest. The Absolute holds good and bad alike. There is no good Absolute and bad Absolute, only the Absolute, whatever form we give it. Her nakedness says that the pull of the body has to be gone beyond, not avoided.",
        ],
      },
      {
        heading: "Vajra and the sun",
        paras: [
          "All her mantras share the words <em>vajra vairocanīye</em>. <em>Vajra</em> is Indra's thunderbolt, made from the spine of the sage Dadhīci, and the lightning it throws. <em>Vairocana</em> is the disc of the sun, where she lives. Together they point at sudden illumination: the Upaniṣads say the Absolute shows itself like lightning, for an instant. The series gives seven of her mantras, three of her own form and four of Pracaṇḍa Caṇḍikā, differing in how four seeds are arranged.",
        ],
      },
    ],
    reflect: "What have you been refusing to feed, in yourself or in others, while lost in something else?",
  },
  {
    n: 6,
    name: "Tripura Bhairavī",
    deva: "त्रिपुरभैरवी",
    epithet: "The fire at the root",
    seat: "The root chakra (mūlādhāra), as kuṇḍalinī herself. Kuṇḍalinī, the series says, is also her name.",
    sections: [
      {
        heading: "The name",
        paras: [
          "<em>Tri</em> is three, <em>pura</em> is city or fortress, and Bhairavī is the consort of Bhairava, a fierce form of Śiva. The three cities of the old story stand for three states of consciousness: waking, dreaming and deep sleep. Like Tripurasundarī she is every triad, and once the triads are crossed, the Absolute is reached. Her grace is how that happens.",
        ],
      },
      {
        heading: "The power of the light",
        paras: [
          "The series uses her chapter to explain how Śiva and Śakti relate. Śiva is the highest, but he rests in his own transcendence; his power to act is Bhairavī, called grace incarnate. Śiva is light, <em>prakāśa</em>. Light alone does nothing until something reflects it, and that reflecting is <em>vimarśa</em>, Bhairavī. Without her, the light stays unknown and Śiva is inert. That does not make her the greater of the two. She exists by his will, and he has handed her his freedom to act. So she becomes 'this', the world, while he remains the pure 'I'. By his will she creates souls and binds them in māyā.",
        ],
      },
      {
        heading: "At the root",
        paras: [
          "She lives in the root chakra. Her mantra has three seeds, and they sit at the three corners of a downward triangle at the centre of that chakra, the triangle called Kāmarūpa. Its three sides are will, knowledge and action: the wish to create, the knowing how, and the doing. Śiva is inside the triangle with her, because the two are never apart. Her yantra shows the same triangle and point, as the Śrī Cakra does.",
          "The difference between the two Tripurās is precise. Tripura Bhairavī is energy held in potential at the base. Tripurasundarī is what wakes that energy and carries it up through the chakras to the crown.",
        ],
      },
      {
        heading: "Speech from the root",
        paras: [
          "She is also a goddess of speech. Sound grows the way a tree does. In the seed, <em>parā</em>, the whole tree is present but nothing shows. When the seed sprouts, <em>paśyantī</em>, it wants to grow but its shape is still unknown. As a sapling, <em>madhyamā</em>, its leaves tell you what kind of tree it will be. Full grown and fruiting, <em>vaikharī</em>, it is known completely. In the body the seed of sound rests as kuṇḍalinī at the root, sprouts at the navel, takes shape at the heart, and leaves as spoken words from the throat. The sound-Absolute and the world-Absolute are not two.",
        ],
      },
      {
        heading: "Her form",
        paras: [
          "She is pictured in several ways: on a lotus with four hands holding a book, a rosary, the gesture of teaching and the gesture of giving; or with a sword and a cup of blood alongside the gestures of fearlessness and giving; or seated on Śiva, which is the form most used in tantric worship; or as a queen close to Rājarājeśvarī. The series lists five of her mantras, each for a different form, all built from dense compound seeds.",
        ],
      },
    ],
    reflect: "What in you is fully formed but has not yet sprouted?",
  },
  {
    n: 7,
    name: "Dhūmāvatī",
    deva: "धूमावती",
    epithet: "The smoke that remains",
    seat: "The heart chakra. Her energy there is strong and always subtle; when it runs too high, dark thoughts and moods rise.",
    sections: [
      {
        heading: "The widow",
        paras: [
          "<em>Dhūma</em> means smoke, usually the smoke of a funeral pyre. Of the ten, only Dhūmāvatī is called inauspicious. She is old, in rags, hair wild, skin wrinkled. She is a widow. She rides a small four-wheeled cart with a crow on its flag, drawn by crows, or, some say, drawn by no one. She lives in the cremation ground. She is said to like bones and blood, and is shown with a winnowing broom, a garland of skulls, and a corpse between her teeth.",
          "She is set beside three other goddesses of ill fortune: Nirṛti, dissolution and calamity; Jyeṣṭhā, misfortune, the elder sister of Lakṣmī; and Alakṣmī, bad luck and want.",
        ],
      },
      {
        heading: "Where she came from",
        paras: [
          "One story says she rose from the churning of the ocean and was married to a sage who soon saw she was not what he had hoped. Viṣṇu told him to take her to every inauspicious place he could find. The two could not live together and parted. She went to Viṣṇu, who told her women would take care of her. They did not, and that is why she looks the way she does.",
          "Another says she was born at the place where Satī entered her father's sacrificial fire. The thick smoke that rose from the fire was Dhūmāvatī. A third says Śiva cursed her to widowhood.",
        ],
      },
      {
        heading: "Why she is among the ten",
        paras: [
          "The series gives a clear answer. Life holds good and bad, lucky and unlucky, right and wrong, and at the highest level of practice those pairs stop mattering, because everything is Śiva. The Śrī Rudram praises Śiva as the lord of thieves and cheats in one section and as the giver of happiness, seated with Umā, in another. If Śiva were only good, he would not be everywhere. Dhūmāvatī is the ugliest face of that truth, shown on purpose.",
          "She is rarely worshipped, and mostly on harsh tantric paths. Yet the series also says she stands for the highest attainment of all, where consciousness has passed beyond every duality in the world. That side of her, it notes, is rarely looked at. Most people see only the widow.",
        ],
      },
      {
        heading: "Seed syllable",
        paras: [
          "Her seed is <em>dhūṁ</em>, and her short mantra repeats it before her name. A thousand-name hymn and a protective hymn to her also exist.",
        ],
      },
    ],
    reflect: "What part of life do you keep treating as outside the sacred?",
  },
  {
    n: 8,
    name: "Bagalāmukhī",
    deva: "बगलामुखी",
    epithet: "The one who stills",
    seat: "The upper palate, called the opening of Indra, where the nectar of meditation drips from the skull. She is also linked with the heart, and has a part in passing between lives.",
    sections: [
      {
        heading: "The name",
        paras: [
          "Sanskrit has no word <em>baga</em>. There is <em>baka</em>, a hypocrite, and <em>valgā</em>, a bridle, and scholars disagree about which the name comes from. Whatever its root, it now works almost as a proper name. She is also called Pītāmbarā Devī, the goddess in yellow, and she is seldom worshipped openly, because her power cuts both ways. Tantric texts use her to paralyse enemies, and it is said she can turn the good bad and the rich poor.",
        ],
      },
      {
        heading: "Three stories",
        paras: [
          "In the first age of the world, a great storm threatened to destroy everything. Viṣṇu meditated for a way out, and Parāśakti appeared and brought Bagalāmukhī out of a pond whose water was yellow with turmeric. Only she could calm the storm. That is why she wears yellow, the colour of auspiciousness and of healing.",
          "In the second, a demon named Madan won a boon that made everything he said come true, and he used it cruelly. People prayed to her. As she was about to cut out his tongue, he saw his error and asked to stay at her feet, and she let him.",
          "The third links her to Dhūmāvatī. The smoke from Satī's sacrificial fire was Dhūmāvatī; Satī herself, in the moment before she entered the fire, was Bagalāmukhī.",
        ],
      },
      {
        heading: "The storm of the mind",
        paras: [
          "The series reads the storm inward. It is the mind arguing with itself about right and wrong, spinning out thought after thought. A realised mind is past such arguments; an ordinary mind is caught in them. Worshipped properly, she stills it. She is shown pulling the demon's tongue with her left hand and raising a club in her right, and the tongue is the point: ego comes out as speech, and it has to be stopped before the mind can be quiet enough for the Self to show.",
          "She is also said to govern the five vital breaths, to command the armies of the Supreme Goddess (possibly a veiled reference to Vārāhī), and to protect whoever meditates on her. For all her fearsome reputation, the series notes she can give the highest knowledge and liberation too.",
        ],
      },
      {
        heading: "Seed syllable",
        paras: [
          "Her seed is <em>hlrīṁ</em>, pronounced 'hleem', with the <em>r</em> silent. <em>Ha</em> is the seed of space, <em>la</em> of earth, <em>ra</em> of fire, the fire that carries every offering to its god. Where <em>hrīṁ</em> energises the breath, the series says, <em>hlrīṁ</em> steadies it. It is also the seed used against harmful influences, especially those that disturb kuṇḍalinī meditation. The series adds that black magic is mostly fear planted in the mind, not a reality, though opinions differ. It gives one mantra for her, which asks her to still the speech and wits of the wicked.",
        ],
      },
    ],
    reflect: "Which argument in your head would you most like to see go quiet?",
  },
  {
    n: 9,
    name: "Mātaṅgī",
    deva: "मातङ्गी",
    epithet: "The outcaste goddess of speech",
    seat: "The throat chakra (viśuddhi). She governs the channel of Sarasvatī that runs from the brow to the tip of the tongue, which is said to give the gift of foretelling.",
    sections: [
      {
        heading: "Beyond Sarasvatī",
        paras: [
          "Mātaṅgī is the ninth. She is ranked above Sarasvatī, because she governs <em>vaikharī</em>, the last stage of sound, the moment it leaves the mouth as speech. The poet Kālidāsa praised her as Śyāmalā, dark as an emerald, the daughter of the sage Mātaṅga. Sarasvatī gives learning and scripture; Mātaṅgī gives the inner knowledge that leads to the Self. She dissolves every pair and triad until māyā lifts, and she teaches that nothing is good and nothing is bad, because the Absolute is everywhere. As Śyāmalā she also presides over all mantras.",
        ],
      },
      {
        heading: "The goddess of leftovers",
        paras: [
          "The best-known story is the strangest. Śiva and Pārvatī and Viṣṇu and Lakṣmī were sharing food, and some fell to the ground. From the fallen food rose a beautiful woman, who asked for <em>prasāda</em>. They gave her their leftovers, <em>ucchiṣṭa</em>, food already touched and eaten from, which everyday rules count as impure. Śiva gave her a boon: whoever worshipped her would have their wishes granted. She is Ucchiṣṭa Mātaṅgī, and the word stays in her mantra.",
          "In another story, Pārvatī goes home to her parents and stays past the day Śiva set. He comes for her disguised as a seller of shell ornaments and asks her for love. She rages, then recognises him, and agrees, taking the form of a dancing girl of the lowest caste. Śiva takes a matching form, and only in their union does he recognise her. Afterward she asks that this form be remembered as Ucchiṣṭa Caṇḍālinī and worshipped before Śiva. The series notes that the Mīnākṣī-Sundareśvara temple in Madurai still keeps that order.",
          "A third story tells of the ascetic Mātaṅga, whose austerity drew the Supreme Goddess to him. From her gaze came Kālī, who turned green, and through that form Mātaṅga gained power over all living things. Buddhist sources also know a Mātaṅgī, whose desire the Buddha quenched and who became one of his close followers.",
        ],
      },
      {
        heading: "Her form",
        paras: [
          "She is green, dressed in red, seated on a lotus, with four hands holding a noose, a trident and a lotus, the fourth making the gestures of giving and teaching. Sometimes she has a parrot and a <em>vīṇā</em>. The series gives five of her mantras, most of them naming her as the one who wins the hearts of all people.",
          "Her lesson is in the leftovers. What rules call impure, she accepts. The final word, the speech that reaches the ear, belongs to the goddess who eats what others throw away.",
        ],
      },
    ],
    reflect: "What have you written off as leftover that might be the very thing you need?",
  },
  {
    n: 10,
    name: "Kamalā",
    deva: "कमला",
    epithet: "The lotus, and everything that blooms",
    seat: "The heart chakra, where she brings auspiciousness and beauty of mind. She works on the material world and fulfils material desire.",
    sections: [
      {
        heading: "The lotus goddess",
        paras: [
          "Kamalā, also Kamalātmikā, is the last of the ten, and the only one not directly bound to Śiva. She is Mahālakṣmī, the power of Viṣṇu. She has four hands: two raise lotuses and two give fearlessness and boons. White elephants, two or four, pour water over her, which the series calls the nectar of bliss. She wears white for peace. Elephants, water, lotus and radiance are all signs of good fortune, and she is called simply Śrī: light, splendour, grace, prosperity, success.",
          "She is worshipped more than any other Mahāvidyā, for two plain reasons: she is auspiciousness itself, and she gives material wealth. Kings worshipped her to keep their kingdoms, and even Indra, the stories say, prospers only by her favour. As Śakti sits in Śiva's left lap, Lakṣmī lives on Viṣṇu's chest, in the mark called the <em>śrīvatsa</em>.",
        ],
      },
      {
        heading: "Pure and impure",
        paras: [
          "In the Lakṣmī Tantra, a central text of the Pāñcarātra tradition, she speaks for herself. She is Viṣṇu's eternal power, called Śrī, free of flaw, fulfilling all his wishes. From a fragment of herself she appears as both pure and impure, and she takes part in all his work. The series points to that line as the mark of the Absolute: to be good and bad at once is what it means to be everywhere. The Śrī Sūkta is her great hymn, a prayer for plenty that asks Agni, the carrier of offerings, to bring the goddess who never fails.",
          "As Mahālakṣmī she is said to give rise to Sarasvatī, Lakṣmī and Mahākālī, who in turn bring forth Brahmā, Viṣṇu and Rudra and their consorts. She also has eight forms, the Aṣṭalakṣmī: the primordial, wealth, grain, elephants, children, courage, victory and knowledge.",
        ],
      },
      {
        heading: "The seed śrīṁ",
        paras: [
          "Her seed is <em>śrīṁ</em>, also called the seed of Ramā, the delightful. Added to the end of the Pañcadaśī it makes the short Ṣoḍaśī. In any mantra, the series says, it deepens devotion and speeds results, and it brings fertility. It gives six of her mantras, from the single seed to a mantra for Siddhalakṣmī.",
        ],
      },
      {
        heading: "Why the last is wealth",
        paras: [
          "It can seem odd that the ten close with the goddess of money. The epilogue of the series explains it. Only when material desire is met can the Self be realised, and without that, liberation cannot come. Kamalā handles the seeker's first quest, and she stays until every material want has been crossed. She is also the one who insists the body is a temple and the soul inside it the shrine.",
        ],
      },
    ],
    reflect: "Which of your wants have you tried to skip instead of satisfying and moving past?",
  },
];

export const EPILOGUE = {
  title: "After the Ten",
  sections: [
    {
      heading: "Why ten, and why so fierce",
      paras: [
        "Why ten forms? Why the corpses and skulls, and why Tantra? The series answers that these questions miss the root. Spiritual life is about understanding Śiva and Śakti, and Śakti is Śiva's own power, no more separable from him than a person's strength is from the person, or a mind from its body. That interdependence is the ground of Tantra.",
        "Tantra purifies inside and out: inwardly by breath practice and the purification of the elements in the body, outwardly by worship that follows the Vedic pattern. Of the two, the inner counts for more. The best practitioners are attached and addicted to nothing, because for them everything is Śiva's consciousness.",
        "When the goddesses are shown in passion, the series says, it is the union of Śiva and Śakti being shown. When Dhūmāvatī is shown as horror, it is the reminder that Śiva is not only good. Each of the ten governs a different faculty of mind and intellect, none is higher or lower, and all ten are needed for us to exist at all.",
      ],
    },
    {
      heading: "Four layers of consciousness",
      paras: [
        "The tantric texts the series follows divide consciousness four ways. <em>Manas</em>, the everyday mind, is tied to ego and split into twos, and is not counted as real knowledge. <em>Manovijñāna</em> is non-dual awareness. <em>Ālayavijñāna</em> is the storehouse beneath awareness. <em>Amalavijñāna</em> is pure consciousness, the Self. Ritual begins and ends in the first. The path starts when non-duality begins to seep in from the intellect, and it runs through the other three until Śiva is found within.",
        "Mind is not easy to tame, and it always keeps traces of desire. Tantra's answer is to live a desire through and burn it out, because any trace left makes a realisation false. Bliss is being with Śakti; consciousness is being with Śiva. As long as one stays in the first, there is danger of falling. So practice goes on until her grace removes māyā altogether, and the seeker moves from existence-consciousness-bliss to existence-consciousness, one Absolute. The fruit of practice, the series adds, depends on its quality, not its length.",
      ],
    },
    {
      heading: "From mantra to silence",
      paras: [
        "In the last stages there is no mantra and no practice. Mantras help only at the start, and even then, the series says, they protect the mind rather than control it. The sound of the syllables sets up subtle vibrations that help kuṇḍalinī rise. Once it wakes, the mantra sinks below awareness and is no longer needed. When the mantra stops, meditation starts on its own, and deepens into absorption, and in that absorption the Self is known.",
        "There is no need to sit for hours. The highest state of meditation may last ten or twenty minutes. In it, ego thins almost to nothing and every doubt is cleared. Consciousness grows purer over time, and the purest consciousness is Śiva.",
      ],
    },
  ],
};

export const GLOSSARY = [
  ["ākāśa", "Space or ether, the first element to arise and the subtlest."],
  ["bīja", "Seed syllable. A sound, usually ending in the nasal dot, that carries the power of a deity."],
  ["bindu", "Point or dot. The centre of a yantra; the nasal dot on a seed syllable; the point from which creation unfolds."],
  ["chakra (cakra)", "Wheel. A centre in the subtle body, from the root (mūlādhāra) to the crown (sahasrāra)."],
  ["dhyāna", "Meditation; also a verse describing a deity's form for meditation."],
  ["iḍā, piṅgalā, suṣumnā", "The left, right and central channels of the subtle body."],
  ["kuṇḍalinī", "The coiled power resting at the base of the spine, which rises through the chakras."],
  ["kūṭa", "Group. One of the three sections of the Pañcadaśī mantra."],
  ["mantra", "A sacred sound or formula, traditionally received from a teacher."],
  ["māyā", "The power that measures the measureless; the veil that makes the one appear as many."],
  ["mokṣa", "Liberation; release from rebirth."],
  ["nāda", "Resonance; the subtle sound that rises from the point."],
  ["Pañcadaśī", "The fifteen-syllable mantra of Tripurasundarī."],
  ["paśyantī, madhyamā, vaikharī", "The stages of sound after parā: sprouting, taking shape, and spoken."],
  ["prakāśa", "Light; Śiva as self-shining awareness."],
  ["prāṇa", "Life-breath; also the first of the five vital breaths."],
  ["sādhana", "Spiritual practice carried through to its end."],
  ["Śakti", "Power; the Goddess as the active power of the Absolute."],
  ["Śrī Cakra", "The yantra of Tripurasundarī: nine interlocking triangles around a central point."],
  ["Śrī Vidyā", "The tradition of worship centred on Tripurasundarī."],
  ["Ṣoḍaśī", "Sixteen. A name of Tripurasundarī, and her sixteen-syllable mantra."],
  ["tantra", "A body of scripture and practice treating the body and world as the ground of realisation."],
  ["turīya", "The fourth state, beyond waking, dreaming and deep sleep."],
  ["vimarśa", "Reflection; Śakti as the power by which light knows itself."],
  ["yantra", "A sacred diagram used as a support for worship."],
];
