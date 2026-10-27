import { getPrisma, disconnect } from "./ingest/lib";

// Seeds the Matangi / Shyamala lore entry, compiled from a January 2023
// Sanskrit-channel livestream on the Shyamala Dandakam. Idempotent via upsert on slug.

const SLUG = "matangi-shyamala";

const SUMMARY =
  "Shyamala, also called Matangi, is the dark form of Saraswati and the counselor of Goddess Lalita. She governs learning in every field, rules the heart chakra, and is worshipped with the Shyamala Dandakam, a chant by Kalidasa.";

const FULL_ENTRY = `NAMES
Shyamala and Matangi are the same goddess. Shyamala means "dark", a shade between deep blue and green that tends toward black, like the evening sky. Matangi is her name as the daughter of Sage Matanga. She is also called Mantrini, the counselor or minister, and Ucchishta Chandalini.

ROLE IN THE LALITA STORY
Goddess Lalita forms from the combined energy of all the devas to fight the asura Bhandasura, who stands for tamas and inertia. Her chariot is the Sri Yantra. Varahi is her commander-in-chief and Shyamala is her counselor. The war is read as an allegory in which the battlefield is the human body.

WHAT SHE REPRESENTS
Shyamala is a form of Saraswati, but not the white, sattvic one. She governs learning and skill in all fields, including rajasic and tamasic ones, with no field counted as higher or lower. She is linked to the Anahata (heart) chakra and presides over music, dance, joy, love and the fine arts. In the Sri Krama order of practice she comes after the foundation: Ganesha at the Muladhara, then Balatripurasundari, then Shyamala at the heart.

ICONOGRAPHY
She holds a veena, which stands for the spine. Some images show four hands and others show sixteen. The hand symbolism matches Lalita's: a sugarcane bow for the mind, five flower arrows for the senses, a noose for attraction and a goad for repulsion. The mind, the senses and likes and dislikes are held apart.

THE SHYAMALA YANTRA
The yantra has eight enclosures: a square bhupura, then lotuses of 4, 8, 16 and 8 petals, a pentagon, a downward triangle and a central bindu. Eight forms of Bhairava are associated with it. The side petals hold Shankhanidhi and Padmanidhi, which is why the Dandakam calls her flanked by them. Its mantras are meant to be learned through proper initiation.

TEXTS AND CHANTS
The main chant is the Shyamala Dandakam by Kalidasa. Others are the Shyamala Kavacham, Navaratna Malika, the Sahasranama, the 108 names, the Matangi Kavacham, the Matangi Hridayam and the 16 names of Shyamala.

THE SHYAMALA DANDAKAM
It has five stanzas, with about 100 names in the main body and 18 in the phalashruti (the stated benefits). It is addressed to her in the first person and opens with "jaya" (be victorious). Long compound words alternate with short ones, so breaths fall at compound boundaries. Texts differ in places, for example madalasa and madashalini in the invocation, and sudhasamudranta and sudhasamudyat at the opening. The speaker chose readings by majority usage and sound flow.

SEASON
Magha brings the Shyamala (Gupta) Navaratri, with Vasanta Panchami during it. The four Navaratris fall once every three months, one per season.

SOURCE
Compiled from a January 2023 Sanskrit-channel livestream, where the speaker credits training at Dvipuram near Anakapalli, Andhra Pradesh. Details of mantra practice are not given there and should be learned through initiation.`;

async function main() {
  const prisma = getPrisma();
  const data = {
    title: "Matangi / Shyamala",
    category: "deity",
    summary: SUMMARY,
    fullEntry: FULL_ENTRY,
    canonStatus: "community_myth" as const,
    searchText: `Matangi Shyamala Mantrini Saraswati Lalita Sri Vidya Dandakam Kalidasa ${SUMMARY}`,
  };
  await prisma.loreEntry.upsert({
    where: { slug: SLUG },
    create: { slug: SLUG, ...data },
    update: data,
  });
  console.log(`upserted lore: ${SLUG}`);
  await disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
