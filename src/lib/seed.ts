import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  console.log("🌱 Seeding Smart Public Library database (library.db)...");

  // 1. Clean slate
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE 
      "AuditLog",
      "PaymentReversal",
      "Receipt",
      "ReceiptSequence",
      "PaymentAllocation",
      "Payment",
      "FeeCharge",
      "Reservation",
      "Loan",
      "BookCopy",
      "BookAuthor",
      "Book",
      "Author",
      "Publisher",
      "Category",
      "LibraryPolicy",
      "MemberSequence",
      "Member",
      "StaffUser"
    CASCADE;
  `);

  // 2. Initialize Sequences
  await prisma.memberSequence.create({
    data: { year: 2026, lastNumber: 10 },
  });
  await prisma.receiptSequence.create({
    data: { prefix: "RCP-202610", lastNumber: 3 },
  });

  // 3. Create Staff Users
  const staffPassword = await bcrypt.hash("Admin@123", 10);

  await prisma.staffUser.createMany({
    data: [
      {
        email: "superadmin@library.gov.in",
        passwordHash: staffPassword,
        name: "Dr. K. S. Thakur",
        role: "SUPER_ADMIN",
        phone: "+91-9811002233",
      },
      {
        email: "admin@library.gov.in",
        passwordHash: staffPassword,
        name: "Smt. Sunita Mukherjee",
        role: "LIBRARY_ADMIN",
        phone: "+91-9811002234",
      },
      {
        email: "librarian@library.gov.in",
        passwordHash: staffPassword,
        name: "Devendra Patel",
        role: "LIBRARIAN",
        phone: "+91-9811002235",
      },
      {
        email: "accounts@library.gov.in",
        passwordHash: staffPassword,
        name: "Manoj Agarwal",
        role: "ACCOUNTS_OPERATOR",
        phone: "+91-9811002236",
      },
      {
        email: "approver@library.gov.in",
        passwordHash: staffPassword,
        name: "Rajeshwar Rao",
        role: "APPROVING_OFFICER",
        phone: "+91-9811002237",
      },
    ],
  });

  // 4. Create Library Policies
  await prisma.libraryPolicy.createMany({
    data: [
      {
        category: "GENERAL_CITIZEN",
        loanDurationDays: 14,
        maxBooks: 3,
        gracePeriodDays: 2,
        fineRatePerDay: 2.0,
        maxFine: 150.0,
        allowRenewal: true,
        renewalLimit: 2,
      },
      {
        category: "STUDENT",
        loanDurationDays: 21,
        maxBooks: 4,
        gracePeriodDays: 3,
        fineRatePerDay: 1.0,
        maxFine: 100.0,
        allowRenewal: true,
        renewalLimit: 3,
      },
      {
        category: "SENIOR_CITIZEN",
        loanDurationDays: 28,
        maxBooks: 5,
        gracePeriodDays: 5,
        fineRatePerDay: 1.0,
        maxFine: 50.0,
        allowRenewal: true,
        renewalLimit: 3,
      },
      {
        category: "RESEARCHER",
        loanDurationDays: 30,
        maxBooks: 8,
        gracePeriodDays: 3,
        fineRatePerDay: 2.0,
        maxFine: 200.0,
        allowRenewal: true,
        renewalLimit: 4,
      },
      {
        category: "GOVT_STAFF",
        loanDurationDays: 28,
        maxBooks: 5,
        gracePeriodDays: 4,
        fineRatePerDay: 1.0,
        maxFine: 100.0,
        allowRenewal: true,
        renewalLimit: 3,
      },
    ],
  });

  // 5. Create Categories
  const catLiterature = await prisma.category.create({
    data: {
      name: "Fiction & World Literature",
      code: "LITERATURE",
      ddcPrefix: "800",
      description: "Novels, regional classics, poetry, drama and prose masters",
      iconName: "BookOpen",
      accentColor: "teal",
    },
  });
  const catScience = await prisma.category.create({
    data: {
      name: "Science & Astronomy",
      code: "SCIENCE",
      ddcPrefix: "500",
      description: "Physics, astronomy, biology, astrophysics and environmental sciences",
      iconName: "Compass",
      accentColor: "blue",
    },
  });
  const catTech = await prisma.category.create({
    data: {
      name: "Technology & Computing",
      code: "CS_TECH",
      ddcPrefix: "004",
      description: "Computer programming, algorithms, operating systems, and networks",
      iconName: "Cpu",
      accentColor: "indigo",
    },
  });
  const catHistory = await prisma.category.create({
    data: {
      name: "History & Heritage",
      code: "HISTORY",
      ddcPrefix: "900",
      description: "Indian freedom struggle, ancient civilisations, biographies and world history",
      iconName: "Landmark",
      accentColor: "amber",
    },
  });
  const catGovernance = await prisma.category.create({
    data: {
      name: "Constitution & Law",
      code: "LAW_GOV",
      ddcPrefix: "340",
      description: "Indian constitutional commentaries, public administration, and jurisprudence",
      iconName: "Scale",
      accentColor: "rose",
    },
  });
  const catPhilosophy = await prisma.category.create({
    data: {
      name: "Philosophy & Self-Growth",
      code: "PHILOSOPHY",
      ddcPrefix: "100",
      description: "Indian philosophical traditions, ethics, logic, and self-realization",
      iconName: "Brain",
      accentColor: "purple",
    },
  });
  const catChildren = await prisma.category.create({
    data: {
      name: "Children & Young Adults",
      code: "CHILDREN",
      ddcPrefix: "823",
      description: "Illustrated fables, Panchatantra, Ruskin Bond tales and science adventures",
      iconName: "Sparkles",
      accentColor: "emerald",
    },
  });

  // 6. Create Publishers
  const pubSahitya = await prisma.publisher.create({
    data: { name: "Sahitya Akademi", address: "Rabindra Bhavan, 35 Ferozeshah Road, New Delhi" },
  });
  const pubGov = await prisma.publisher.create({
    data: { name: "Publications Division, Govt of India", address: "Soochna Bhawan, CGO Complex, New Delhi" },
  });
  const pubNBT = await prisma.publisher.create({
    data: { name: "National Book Trust (NBT) India", address: "Nehru Bhawan, 5 Institutional Area, Vasant Kunj, New Delhi" },
  });
  const pubOxford = await prisma.publisher.create({
    data: { name: "Oxford University Press India", address: "YMCA Library Building, Jai Singh Road, New Delhi" },
  });
  const pubPearson = await prisma.publisher.create({
    data: { name: "Pearson Education India", address: "Sector 62, Noida" },
  });
  const pubPenguin = await prisma.publisher.create({
    data: { name: "Penguin Random House India", address: "Infinity Tower C, Cyber City, Gurugram" },
  });

  // 7. Create Authors
  const authorData = [
    { name: "Dr. A. P. J. Abdul Kalam", biography: "Aerospace scientist and 11th President of India, recipient of the Bharat Ratna." },
    { name: "Munshi Premchand", biography: "Pioneering novelist of modern Hindi and Urdu literature known for social realism." },
    { name: "Dr. B. R. Ambedkar", biography: "Chief Architect of the Constitution of India, jurist, economist, and social reformer." },
    { name: "Rabindranath Tagore", biography: "Nobel laureate poet, polymath, composer, and creator of modern Indian literature." },
    { name: "R. K. Narayan", biography: "Leading figure of early Indian literature in English, creator of the fictional town of Malgudi." },
    { name: "Ruskin Bond", biography: "Eminent author of Indian children's literature and Himalayan memoirs." },
    { name: "Dr. Sudha Murty", biography: "Philanthropist, educator, and beloved author of inspiring short stories and fables." },
    { name: "Andrew S. Tanenbaum", biography: "Professor Emeritus of Computer Science and author of standard textbooks." },
    { name: "Dennis M. Ritchie", biography: "Creator of the C programming language and co-creator of Unix operating system." },
    { name: "Brian W. Kernighan", biography: "Computer scientist and co-author of the seminal C Programming manual." },
    { name: "Carl Sagan", biography: "Astronomer, astrophysicist, and author of scientific humanism classics." },
    { name: "Stephen Hawking", biography: "Theoretical physicist, cosmologist, and author of A Brief History of Time." },
  ];
  const authors: any[] = [];
  for (const a of authorData) {
    authors.push(await prisma.author.create({ data: a }));
  }

  const [
    autKalam,
    autPremchand,
    autAmbedkar,
    autTagore,
    autNarayan,
    autBond,
    autMurty,
    autTanenbaum,
    autRitchie,
    autKernighan,
    autSagan,
    autHawking,
  ] = authors;

  // 8. Create Rich Bibliographic Records with Physical Copies
  const booksData = [
    {
      isbn: "9788173711466",
      title: "Wings of Fire: An Autobiography",
      subtitle: "An inspiring journey of the Missile Man of India",
      edition: "Special Anniversary Edition",
      publicationYear: 1999,
      language: "English / Hindi",
      ddcCode: "920.054",
      bookNumber: "KAL-WOF",
      description: "An extraordinary autobiographical narrative tracing Dr. Kalam's early childhood in Rameswaram, his career at ISRO, and his pivotal leadership in Indian aerospace and defense technology.",
      publisherId: pubGov.id,
      categoryId: catHistory.id,
      authorIds: [autKalam.id],
      isFeatured: true,
      isEditorChoice: true,
      isPopular: true,
      coverImageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
      copies: [
        { accessionNo: "ACC-2026-0001", shelfLocation: "Aisle 1, Rack B, Shelf 2", status: "AVAILABLE", cost: 295 },
        { accessionNo: "ACC-2026-0002", shelfLocation: "Aisle 1, Rack B, Shelf 2", status: "AVAILABLE", cost: 295 },
        { accessionNo: "ACC-2026-0003", shelfLocation: "Aisle 1, Rack B, Shelf 2", status: "REFERENCE_ONLY", cost: 295 },
      ],
    },
    {
      isbn: "9788171673407",
      title: "Godaan (गोदान)",
      subtitle: "The Gift of a Cow — Masterpiece of Hindi Realism",
      edition: "Sahitya National Edition",
      publicationYear: 1936,
      language: "Hindi",
      ddcCode: "891.433",
      bookNumber: "PRE-GOD",
      description: "Premchand's crowning literary achievement portraying peasant life in colonial India, highlighting the moral dignity, structural poverty, and socio-economic struggles of the common farmer Hori.",
      publisherId: pubSahitya.id,
      categoryId: catLiterature.id,
      authorIds: [autPremchand.id],
      isFeatured: true,
      isEditorChoice: true,
      isPopular: true,
      coverImageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80",
      copies: [
        { accessionNo: "ACC-2026-0004", shelfLocation: "Aisle 3, Rack A, Shelf 1", status: "AVAILABLE", cost: 180 },
        { accessionNo: "ACC-2026-0005", shelfLocation: "Aisle 3, Rack A, Shelf 1", status: "AVAILABLE", cost: 180 },
      ],
    },
    {
      isbn: "9788170110309",
      title: "The Constitution of India: Bare Act with Commentary",
      subtitle: "Sovereign, Socialist, Secular, Democratic Republic",
      edition: "Centenary Commemorative Edition",
      publicationYear: 1950,
      language: "English / Hindi",
      ddcCode: "342.54",
      bookNumber: "AMB-CON",
      description: "The foundational legal text establishing fundamental rights, directive principles, and parliamentary democracy in India, curated with original drafting assembly debates.",
      publisherId: pubGov.id,
      categoryId: catGovernance.id,
      authorIds: [autAmbedkar.id],
      isFeatured: true,
      isEditorChoice: false,
      isPopular: true,
      coverImageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80",
      copies: [
        { accessionNo: "ACC-2026-0006", shelfLocation: "Aisle 2, Rack A, Shelf 1", status: "REFERENCE_ONLY", cost: 650 },
        { accessionNo: "ACC-2026-0007", shelfLocation: "Aisle 2, Rack A, Shelf 1", status: "AVAILABLE", cost: 650 },
      ],
    },
    {
      isbn: "9780133591620",
      title: "Modern Operating Systems",
      subtitle: "Fourth Edition: Concurrency, Virtualization & Security",
      edition: "4th Global Edition",
      publicationYear: 2014,
      language: "English",
      ddcCode: "005.43",
      bookNumber: "TAN-MOS",
      description: "Authoritative academic reference covering kernel architecture, process management, memory paging, file systems, and distributed system design.",
      publisherId: pubPearson.id,
      categoryId: catTech.id,
      authorIds: [autTanenbaum.id],
      isFeatured: false,
      isEditorChoice: true,
      isPopular: true,
      coverImageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80",
      copies: [
        { accessionNo: "ACC-2026-0008", shelfLocation: "Aisle 4, Rack C, Shelf 2", status: "AVAILABLE", cost: 890 },
        { accessionNo: "ACC-2026-0009", shelfLocation: "Aisle 4, Rack C, Shelf 2", status: "AVAILABLE", cost: 890 },
      ],
    },
    {
      isbn: "9780131103627",
      title: "The C Programming Language",
      subtitle: "Second Edition (ANSI C Standard)",
      edition: "2nd Edition",
      publicationYear: 1988,
      language: "English",
      ddcCode: "005.133",
      bookNumber: "KER-CPR",
      description: "The definitive guide written by the language designers Dennis Ritchie and Brian Kernighan. Clear syntax rules, memory pointers, and standard library reference.",
      publisherId: pubPearson.id,
      categoryId: catTech.id,
      authorIds: [autKernighan.id, autRitchie.id],
      isFeatured: false,
      isEditorChoice: false,
      isPopular: true,
      coverImageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80",
      copies: [
        { accessionNo: "ACC-2026-0010", shelfLocation: "Aisle 4, Rack C, Shelf 3", status: "AVAILABLE", cost: 450 },
        { accessionNo: "ACC-2026-0011", shelfLocation: "Aisle 4, Rack C, Shelf 3", status: "AVAILABLE", cost: 450 },
      ],
    },
    {
      isbn: "9788172234980",
      title: "Gitanjali (गीतांजलि): Song Offerings",
      subtitle: "With an Introduction by W. B. Yeats",
      edition: "Heritage Nobel Edition",
      publicationYear: 1912,
      language: "Bengali / English / Hindi",
      ddcCode: "891.441",
      bookNumber: "TAG-GIT",
      description: "Tagore's timeless collection of devotional poetry that earned Asia its first Nobel Prize in Literature in 1913, reflecting spiritual communion with nature and the divine.",
      publisherId: pubSahitya.id,
      categoryId: catLiterature.id,
      authorIds: [autTagore.id],
      isFeatured: true,
      isEditorChoice: true,
      isPopular: false,
      coverImageUrl: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=600&auto=format&fit=crop&q=80",
      copies: [
        { accessionNo: "ACC-2026-0012", shelfLocation: "Aisle 3, Rack B, Shelf 1", status: "AVAILABLE", cost: 220 },
      ],
    },
    {
      isbn: "9780143422983",
      title: "Malgudi Days",
      subtitle: "Short Stories of Charm and Irony in South India",
      edition: "Classics Illustrated",
      publicationYear: 1943,
      language: "English / Hindi",
      ddcCode: "823.912",
      bookNumber: "NAR-MAL",
      description: "Heartwarming short stories portraying the eccentricities, humor, and innocence of daily life in the fictional idyllic town of Malgudi.",
      publisherId: pubPenguin.id,
      categoryId: catLiterature.id,
      authorIds: [autNarayan.id],
      isFeatured: false,
      isEditorChoice: false,
      isPopular: true,
      coverImageUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80",
      copies: [
        { accessionNo: "ACC-2026-0013", shelfLocation: "Aisle 3, Rack B, Shelf 2", status: "AVAILABLE", cost: 250 },
        { accessionNo: "ACC-2026-0014", shelfLocation: "Aisle 3, Rack B, Shelf 2", status: "AVAILABLE", cost: 250 },
      ],
    },
    {
      isbn: "9780143335374",
      title: "The Blue Umbrella & Other Mountain Tales",
      subtitle: "A Heartwarming Story of Innocence and Kindness",
      edition: "Illustrated Children's Library",
      publicationYear: 1980,
      language: "English / Hindi",
      ddcCode: "823.92",
      bookNumber: "BON-BLU",
      description: "Set in a quaint Garhwal village, Binya trades her leopard-claw pendant for a stunning blue umbrella, exploring envy, redemption, and friendship.",
      publisherId: pubPenguin.id,
      categoryId: catChildren.id,
      authorIds: [autBond.id],
      isFeatured: false,
      isEditorChoice: true,
      isPopular: true,
      coverImageUrl: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&auto=format&fit=crop&q=80",
      copies: [
        { accessionNo: "ACC-2026-0015", shelfLocation: "Aisle 5, Rack A, Shelf 1", status: "AVAILABLE", cost: 175 },
        { accessionNo: "ACC-2026-0016", shelfLocation: "Aisle 5, Rack A, Shelf 1", status: "AVAILABLE", cost: 175 },
      ],
    },
    {
      isbn: "9780143333165",
      title: "Wise and Otherwise: A Salute to Life",
      subtitle: "Inspiring Vignettes from Rural & Urban India",
      edition: "Special Jubilee Edition",
      publicationYear: 2002,
      language: "English / Hindi",
      ddcCode: "158.1",
      bookNumber: "MUR-WIS",
      description: "Fifty candid vignettes drawn from Sudha Murty's travel across India as trustee of the Infosys Foundation, exploring human vulnerability, nobility, and wisdom.",
      publisherId: pubPenguin.id,
      categoryId: catPhilosophy.id,
      authorIds: [autMurty.id],
      isFeatured: true,
      isEditorChoice: false,
      isPopular: true,
      coverImageUrl: "https://images.unsplash.com/photo-1491841573634-28140fc7ced7?w=600&auto=format&fit=crop&q=80",
      copies: [
        { accessionNo: "ACC-2026-0017", shelfLocation: "Aisle 2, Rack C, Shelf 1", status: "AVAILABLE", cost: 250 },
      ],
    },
    {
      isbn: "9780345539434",
      title: "Cosmos: The Story of Cosmic Evolution",
      subtitle: "Science and Civilization Through the Eyes of Carl Sagan",
      edition: "Revised Illustrated Edition",
      publicationYear: 1980,
      language: "English",
      ddcCode: "520",
      bookNumber: "SAG-COS",
      description: "One of the most bestselling scientific volumes in history, charting fifteen billion years of cosmic evolution, anthropological curiosity, and space exploration.",
      publisherId: pubOxford.id,
      categoryId: catScience.id,
      authorIds: [autSagan.id],
      isFeatured: true,
      isEditorChoice: true,
      isPopular: true,
      coverImageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80",
      copies: [
        { accessionNo: "ACC-2026-0018", shelfLocation: "Aisle 1, Rack A, Shelf 2", status: "AVAILABLE", cost: 699 },
        { accessionNo: "ACC-2026-0019", shelfLocation: "Aisle 1, Rack A, Shelf 2", status: "AVAILABLE", cost: 699 },
      ],
    },
    {
      isbn: "9780553380163",
      title: "A Brief History of Time",
      subtitle: "From the Big Bang to Black Holes",
      edition: "10th Anniversary Expanded Edition",
      publicationYear: 1988,
      language: "English / Hindi",
      ddcCode: "523.1",
      bookNumber: "HAW-ABH",
      description: "Professor Stephen Hawking's monumental exposition on the physics of space-time, quantum gravity, black holes, and the origins of the universe.",
      publisherId: pubOxford.id,
      categoryId: catScience.id,
      authorIds: [autHawking.id],
      isFeatured: false,
      isEditorChoice: true,
      isPopular: true,
      coverImageUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80",
      copies: [
        { accessionNo: "ACC-2026-0020", shelfLocation: "Aisle 1, Rack A, Shelf 3", status: "AVAILABLE", cost: 499 },
      ],
    },
    {
      isbn: "9788170188988",
      title: "Discovery of India (भारत एक खोज)",
      subtitle: "Historical and Cultural Essays Written in Ahmednagar Fort",
      edition: "Oxford Commemorative Library",
      publicationYear: 1946,
      language: "English / Hindi",
      ddcCode: "954.035",
      bookNumber: "NEH-DIS",
      description: "Jawaharlal Nehru's sweeping philosophical inquiry into the cultural continuity, philosophy, and history of India from the Indus Valley civilization onwards.",
      publisherId: pubOxford.id,
      categoryId: catHistory.id,
      authorIds: [autKalam.id], // using kalam as co-custodian or generic
      isFeatured: true,
      isEditorChoice: true,
      isPopular: false,
      coverImageUrl: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=600&auto=format&fit=crop&q=80",
      copies: [
        { accessionNo: "ACC-2026-0021", shelfLocation: "Aisle 1, Rack C, Shelf 1", status: "AVAILABLE", cost: 450 },
      ],
    },
  ];

  for (const b of booksData) {
    const book = await prisma.book.create({
      data: {
        isbn: b.isbn,
        title: b.title,
        subtitle: b.subtitle,
        edition: b.edition,
        publicationYear: b.publicationYear,
        language: b.language,
        ddcCode: b.ddcCode,
        bookNumber: b.bookNumber,
        description: b.description,
        publisherId: b.publisherId,
        categoryId: b.categoryId,
        isFeatured: b.isFeatured,
        isEditorChoice: b.isEditorChoice,
        isPopular: b.isPopular,
        coverImageUrl: b.coverImageUrl,
        copies: {
          create: b.copies.map((c, idx) => ({
            accessionNo: c.accessionNo,
            copyNumber: idx + 1,
            qrCodeToken: `QR-GPLMS-${c.accessionNo}`,
            shelfLocation: c.shelfLocation,
            acquisitionCost: c.cost,
            status: c.status,
          })),
        },
        authors: {
          create: b.authorIds.map((authorId) => ({
            author: { connect: { id: authorId } },
          })),
        },
      },
    });
  }

  // 9. Create Members
  const memberPassword = await bcrypt.hash("Member@123", 10);

  const memberRahul = await prisma.member.create({
    data: {
      memberNo: "GPL-2026-00001",
      fullName: "Rahul Verma",
      email: "rahul.verma@student.delhiuniv.ac.in",
      phone: "+91-9876543210",
      address: "Room 14, Gwyer Hall, University of Delhi North Campus",
      passwordHash: memberPassword,
      category: "STUDENT",
      status: "ACTIVE",
      expiryDate: new Date("2027-06-30"),
      maxBooks: 4,
    },
  });

  const memberPriya = await prisma.member.create({
    data: {
      memberNo: "GPL-2026-00002",
      fullName: "Dr. Priya Sen",
      email: "priya.sen@iitd.ac.in",
      phone: "+91-9876543211",
      address: "Faculty Apartments Block B, IIT Delhi",
      passwordHash: memberPassword,
      category: "RESEARCHER",
      status: "ACTIVE",
      expiryDate: new Date("2027-12-31"),
      maxBooks: 8,
    },
  });

  const memberVikram = await prisma.member.create({
    data: {
      memberNo: "GPL-2026-00003",
      fullName: "Vikram Malhotra",
      email: "vikram.malhotra@gmail.com",
      phone: "+91-9876543212",
      address: "C-42, Hauz Khas Enclave, New Delhi",
      passwordHash: memberPassword,
      category: "GENERAL_CITIZEN",
      status: "ACTIVE",
      expiryDate: new Date("2027-04-15"),
      maxBooks: 3,
    },
  });

  // 10. Create an active loan for Rahul
  const copy1 = await prisma.bookCopy.findUnique({ where: { accessionNo: "ACC-2026-0001" } });
  if (copy1) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    await prisma.loan.create({
      data: {
        copyId: copy1.id,
        memberId: memberRahul.id,
        dueDate,
        status: "ACTIVE",
        issuedBy: "Devendra Patel",
      },
    });

    await prisma.bookCopy.update({
      where: { id: copy1.id },
      data: { status: "ISSUED" },
    });
  }

  console.log("✅ Smart Library Database seeded successfully with realistic catalog holdings!");
}

seedDatabase()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
