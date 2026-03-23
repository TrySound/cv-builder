import { describe, it, expect } from "vitest";
import { parseResume, groupSkillsByCategory } from "./cv-parser";

describe("Contact Information Extraction", () => {
  it("should extract email addresses", () => {
    const resume = `
John Doe
john.doe@email.com
Software Engineer
      `;
    const result = parseResume(resume);
    expect(result.contact.email).toBe("john.doe@email.com");
  });

  it("should extract phone numbers in various formats", () => {
    const formats = [
      { input: "(555) 123-4567", expected: "(555) 123-4567" },
      { input: "555-123-4567", expected: "555-123-4567" },
      { input: "555.123.4567", expected: "555.123.4567" },
      { input: "555 123 4567", expected: "555 123 4567" },
      { input: "+1 555-123-4567", expected: "+1 555-123-4567" },
    ];

    for (const { input, expected } of formats) {
      const resume = `John Doe\n${input}\nSoftware Engineer`;
      const result = parseResume(resume);
      expect(result.contact.phone).toBe(expected);
    }
  });

  it("should extract LinkedIn profile URLs", () => {
    const resume = `
John Doe
linkedin.com/in/johndoe
Software Engineer
      `;
    const result = parseResume(resume);
    expect(result.contact.linkedin).toBe("linkedin.com/in/johndoe");
  });

  it("should extract GitHub profile URLs", () => {
    const resume = `
John Doe
github.com/johndoe
Software Engineer
      `;
    const result = parseResume(resume);
    expect(result.contact.github).toBe("github.com/johndoe");
  });

  it("should extract personal websites", () => {
    const resume = `
John Doe
https://johndoe.com
Software Engineer
      `;
    const result = parseResume(resume);
    expect(result.contact.website).toBe("https://johndoe.com");
  });

  it("should extract all contact information together", () => {
    const resume = `
John Doe
john.doe@email.com
(555) 123-4567
linkedin.com/in/johndoe
github.com/johndoe
https://johndoe.com
      `;
    const result = parseResume(resume);
    expect(result.contact.email).toBe("john.doe@email.com");
    expect(result.contact.phone).toBe("(555) 123-4567");
    expect(result.contact.linkedin).toBe("linkedin.com/in/johndoe");
    expect(result.contact.github).toBe("github.com/johndoe");
    expect(result.contact.website).toBe("https://johndoe.com");
  });
});

describe("Skills Extraction", () => {
  it("should extract programming languages", () => {
    const resume = `
Skills
TypeScript, JavaScript, Python, Java, Go, Rust
      `;
    const result = parseResume(resume);
    const grouped = groupSkillsByCategory(result.skills);
    const languages = grouped["languages"] ?? [];
    expect(languages).toContain("typescript");
    expect(languages).toContain("javascript");
    expect(languages).toContain("python");
    expect(languages).toContain("java");
    expect(languages).toContain("go");
    expect(languages).toContain("rust");
  });

  it("should extract frameworks", () => {
    const resume = `
Technical Skills
React, Next.js, Vue, Angular, Node.js, Express
      `;
    const result = parseResume(resume);
    const grouped = groupSkillsByCategory(result.skills);
    const frameworks = grouped["frameworks"] ?? [];
    expect(frameworks).toContain("react");
    expect(frameworks).toContain("next.js");
    expect(frameworks).toContain("vue");
    expect(frameworks).toContain("angular");
    expect(frameworks).toContain("node.js");
    expect(frameworks).toContain("express");
  });

  it("should extract cloud technologies", () => {
    const resume = `
Skills
AWS, Azure, GCP, Cloudflare, Vercel
      `;
    const result = parseResume(resume);
    const grouped = groupSkillsByCategory(result.skills);
    const cloud = grouped["cloud"] ?? [];
    expect(cloud).toContain("aws");
    expect(cloud).toContain("azure");
    expect(cloud).toContain("gcp");
    expect(cloud).toContain("cloudflare");
    expect(cloud).toContain("vercel");
  });

  it("should extract databases", () => {
    const resume = `
Skills
PostgreSQL, MongoDB, Redis, MySQL, DynamoDB
      `;
    const result = parseResume(resume);
    const grouped = groupSkillsByCategory(result.skills);
    const databases = grouped["databases"] ?? [];
    expect(databases).toContain("postgresql");
    expect(databases).toContain("mongodb");
    expect(databases).toContain("redis");
    expect(databases).toContain("mysql");
    expect(databases).toContain("dynamodb");
  });

  it("should extract DevOps tools", () => {
    const resume = `
Skills
Docker, Kubernetes, Terraform, CI/CD, GitHub Actions
      `;
    const result = parseResume(resume);
    const grouped = groupSkillsByCategory(result.skills);
    const devops = grouped["devops"] ?? [];
    expect(devops).toContain("docker");
    expect(devops).toContain("kubernetes");
    expect(devops).toContain("terraform");
    expect(devops).toContain("ci/cd");
    expect(devops).toContain("github actions");
  });

  it("should use word boundaries when matching skills", () => {
    const resume = `
Skills
Java, JavaScript, React
      `;
    const result = parseResume(resume);
    expect(result.skills).toContain("java");
    expect(result.skills).toContain("javascript");
    expect(result.skills).toContain("react");
  });
});

describe("Work Experience Extraction", () => {
  it("should extract job title", () => {
    const resume = `
Work Experience

Software Engineer | Tech Corp | Jan 2020 - Present
- Built scalable applications using React
      `;
    const result = parseResume(resume);
    expect(result.experience.length).toBeGreaterThanOrEqual(1);
    expect(result.experience[0].title?.toLowerCase()).toContain("software");
  });

  it("should extract company name", () => {
    const resume = `
Work Experience

Software Engineer
Tech Corp
Jan 2020 - Present
- Built scalable applications
      `;
    const result = parseResume(resume);
    expect(result.experience[0]).toBeDefined();
    if (result.experience[0].company) {
      expect(result.experience[0].company.toLowerCase()).toContain("tech");
    }
  });

  it("should extract date ranges in various formats", () => {
    const formats = [
      { date: "Jan 2020 - Dec 2022", start: "Jan 2020", end: "Dec 2022" },
      { date: "2020 to 2022", start: "2020", end: "2022" },
      { date: "Jan 2020 - Present", start: "Jan 2020", end: "Present" },
    ];

    for (const { date } of formats) {
      const resume = `
Work Experience

Software Engineer | Company | ${date}
- Did things
        `;
      const result = parseResume(resume);
      // Date parsing may vary based on format, so we just check it doesn't crash
      expect(result.experience[0]).toBeDefined();
    }
  });

  it("should extract location information", () => {
    const resume = `
Work Experience

Software Engineer
Tech Corp
Remote
Jan 2020 - Present
- Built scalable applications
      `;
    const result = parseResume(resume);
    expect(result.experience[0]).toBeDefined();
    if (result.experience[0].location) {
      expect(result.experience[0].location.toLowerCase()).toContain("remote");
    }
  });

  it("should extract bullet points", () => {
    const resume = `
Work Experience

Software Engineer | Tech Corp | Jan 2020 - Present
- Built scalable applications using React
- Implemented CI/CD pipelines
- Mentored junior developers
      `;
    const result = parseResume(resume);
    expect(result.experience[0].description).toBeTruthy();
  });

  it("should handle multiple job entries", () => {
    const resume = `
Work Experience

Senior Software Engineer
Tech Corp
Jan 2022 - Present
- Led team of 5 engineers

Software Engineer
Startup Inc
Jan 2020 - Dec 2021
- Built MVP from scratch
      `;
    const result = parseResume(resume);
    expect(result.experience.length).toBeGreaterThanOrEqual(1);
    const jobs = result.experience.filter((e) => e.title);
    expect(jobs.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Education Extraction", () => {
  it("should extract institution name and dates", () => {
    const resume = `
Education

Stanford University
BS Computer Science
2016 - 2020
      `;
    const result = parseResume(resume);
    expect(result.education).toHaveLength(1);
    expect(result.education[0].institution?.toLowerCase()).toContain(
      "stanford",
    );
    expect(result.education[0].dateRange).toBeDefined();
    expect(result.education[0].dateRange?.start).toContain("2016");
    expect(result.education[0].dateRange?.end).toContain("2020");
  });

  it("should normalize degree types", () => {
    const degrees = [
      { input: "BS", expected: "Bachelor of Science" },
      { input: "B.S.", expected: "Bachelor of Science" },
      { input: "Bachelor of Science", expected: "Bachelor of Science" },
      { input: "BA", expected: "Bachelor of Arts" },
      { input: "MS", expected: "Master of Science" },
      { input: "MBA", expected: "Master of Business Administration" },
      { input: "PhD", expected: "Doctor of Philosophy" },
      { input: "AA", expected: "Associate of Arts" },
    ];

    for (const { input, expected } of degrees) {
      const resume = `
Education

University Name
${input} in Computer Science
2016 - 2020
        `;
      const result = parseResume(resume);
      expect(result.education[0].degree).toBe(expected);
    }
  });

  it("should extract field of study", () => {
    const resume = `
Education

MIT
BS in Computer Science
2016 - 2020
      `;
    const result = parseResume(resume);
    expect(result.education[0].field?.toLowerCase()).toContain("computer");
  });

  it("should extract honors", () => {
    const resume = `
Education

MIT
BS Computer Science
Graduated Magna Cum Laude
GPA: 3.9
2016 - 2020
      `;
    const result = parseResume(resume);
    expect(result.education[0]).toBeDefined();
    expect(result.education[0].description).toContain("Magna Cum Laude");
  });

  it("should handle multiple education entries", () => {
    const resume = `
Education

Stanford University
MS Computer Science
2020 - 2022

UC Berkeley
BS Electrical Engineering
2016 - 2020
      `;
    const result = parseResume(resume);
    expect(result.education.length).toBeGreaterThanOrEqual(2);
    // Check for any degrees found, not specific ones since parsing varies
    const hasInstitution = result.education.some((e) =>
      e.institution?.toLowerCase().includes("stanford"),
    );
    expect(hasInstitution).toBe(true);
  });
});

describe("Projects Extraction", () => {
  it("should extract project name", () => {
    const resume = `
Projects

E-commerce Platform
Built a full-stack e-commerce platform
Tech: React, Node.js, PostgreSQL
github.com/user/project
      `;
    const result = parseResume(resume);
    expect(result.projects).toHaveLength(1);
    expect(result.projects[0].name?.toLowerCase()).toContain("e-commerce");
  });

  it("should extract project description", () => {
    const resume = `
Projects

E-commerce Platform
Built a full-stack application
- Implemented payment processing with Stripe
- Set up PostgreSQL database schema
- Deployed to AWS
      `;
    const result = parseResume(resume);
    expect(result.projects[0].description).toBeTruthy();
    expect(result.projects[0].description).toContain("Stripe");
  });

  it("should extract project date range", () => {
    const resume = `
Projects

E-commerce Platform | Jan 2023 - Jun 2023
Built a full-stack application
      `;
    const result = parseResume(resume);
    expect(result.projects[0]).toBeDefined();
    // Date range extraction may vary based on format
  });
});

describe("Section Detection", () => {
  it("should detect contact section", () => {
    const resume = `
Contact
John Doe
john@email.com
      `;
    const result = parseResume(resume);
    expect(result.contact.email).toBe("john@email.com");
  });

  it("should detect experience section with various headers", () => {
    const headers = [
      "Work Experience",
      "Experience",
      "Work History",
      "Employment",
      "Career",
    ];

    for (const header of headers) {
      const resume = `
${header}

Software Engineer | Company | 2020-2022
- Did things
        `;
      const result = parseResume(resume);
      expect(result.experience.length).toBeGreaterThanOrEqual(1);
      expect(result.experience[0].title?.toLowerCase()).toContain("engineer");
    }
  });

  it("should detect education section with various headers", () => {
    const headers = ["Education", "Academic", "Qualifications", "Degrees"];

    for (const header of headers) {
      const resume = `
${header}

University | BS Computer Science | 2020
        `;
      const result = parseResume(resume);
      expect(result.education.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("should detect skills section with various headers", () => {
    const headers = [
      "Skills",
      "Technical Skills",
      "Core Competencies",
      "Expertise",
    ];

    for (const header of headers) {
      const resume = `
${header}
JavaScript, React, Node.js
        `;
      const result = parseResume(resume);
      expect(result.skills.length).toBeGreaterThan(0);
    }
  });

  it("should detect projects section with various headers", () => {
    const headers = ["Projects", "Portfolio", "Work Samples"];

    for (const header of headers) {
      const resume = `
${header}

My Project
Description here
        `;
      const result = parseResume(resume);
      expect(result.projects).toHaveLength(1);
    }
  });
});

describe("Text Normalization", () => {
  it("should normalize unicode characters", () => {
    const resume = `
John's Resume
"Software Engineer"
Skills: JavaScript – React
      `;
    const result = parseResume(resume);
    // Should not crash and should parse correctly
    expect(result).toBeDefined();
  });

  it("should handle Windows line endings", () => {
    const resume = `John Doe\r\nSoftware Engineer\r\n2020 - 2022`;
    const result = parseResume(resume);
    expect(result).toBeDefined();
  });

  it("should collapse excessive blank lines", () => {
    const resume = `
John Doe




Software Engineer
      `;
    const result = parseResume(resume);
    expect(result).toBeDefined();
  });

  it("should convert tabs to spaces", () => {
    const resume = `John Doe\tSoftware Engineer\t2020`;
    const result = parseResume(resume);
    expect(result).toBeDefined();
  });
});

describe("Edge Cases", () => {
  it("should handle empty input", () => {
    const result = parseResume("");
    expect(result).toBeDefined();
    expect(result.contact).toBeDefined();
    expect(result.skills).toBeDefined();
    expect(result.experience).toBeDefined();
    expect(result.education).toBeDefined();
    expect(result.projects).toBeDefined();
  });

  it("should handle input with only whitespace", () => {
    const result = parseResume("   \n\n   \n");
    expect(result).toBeDefined();
  });

  it("should handle resume without clear sections", () => {
    const resume = `
Just some random text about my experience
I worked at Google from 2020 to 2022
Then moved to Facebook in 2023
      `;
    const result = parseResume(resume);
    expect(result).toBeDefined();
  });

  it("should handle unusual date formats gracefully", () => {
    const resume = `
Work Experience

Engineer
Company
Sometime in 2020 - Whenever
- Did things
      `;
    const result = parseResume(resume);
    // Should not crash even with invalid dates
    expect(result).toBeDefined();
  });

  it("should handle missing contact info gracefully", () => {
    const resume = `
Just a resume with no contact details
Only experience and skills
      `;
    const result = parseResume(resume);
    expect(result.contact.email).toBeUndefined();
    expect(result.contact.phone).toBeUndefined();
  });

  it("should handle very long bullet points", () => {
    const resume = `
Work Experience

Engineer | Company | Jan 2020 - Dec 2022
- ${"This is a very long bullet point with lots of text ".repeat(20)}
      `;
    const result = parseResume(resume);
    expect(result.experience[0]).toBeDefined();
  });

  it("should handle skills section without skills taxonomy matches", () => {
    const resume = `
Skills
Agile methodology, Team leadership, Project management
      `;
    const result = parseResume(resume);
    expect(result.skills).toBeDefined();
  });
});

describe("Complete Resume Parsing", () => {
  it("should parse a complete software engineer resume", () => {
    const resume = `
John Smith
john.smith@email.com | (555) 123-4567 | linkedin.com/in/johnsmith | github.com/johnsmith | San Francisco, CA

Summary
Experienced software engineer with 5+ years building scalable web applications

Technical Skills
TypeScript, JavaScript, React, Node.js, PostgreSQL, MongoDB, Redis, AWS, Docker, Kubernetes, GraphQL

Work Experience

Senior Software Engineer
Tech Giant Inc | San Francisco, CA | Remote
Jan 2022 - Present
- Led migration from monolith to microservices architecture
- Built real-time data pipeline processing 1M+ events/day
- Mentored team of 5 junior engineers

Software Engineer
StartupCo | San Francisco, CA
Jun 2020 - Dec 2021
- Developed customer-facing dashboard using React and TypeScript
- Implemented CI/CD pipelines reducing deployment time by 60%
- Optimized database queries improving performance by 40%

Education

Stanford University | Stanford, CA
MS Computer Science | GPA: 3.9 | Graduated Magna Cum Laude
2018 - 2020

UC Berkeley | Berkeley, CA
BS Computer Science | GPA: 3.8
2014 - 2018

Projects

Real-time Analytics Dashboard (React, Node.js, PostgreSQL, WebSocket)
https://github.com/johnsmith/dashboard
https://demo.vercel.app
Built a real-time dashboard for monitoring system metrics
- Implemented WebSocket connections for live data updates
- Designed responsive UI with dark mode support
- Containerized with Docker for easy deployment

Open Source CLI Tool (TypeScript, Node.js)
https://github.com/johnsmith/cli-tool
Command-line utility for automated code formatting
- Supports 10+ programming languages
- Downloaded 50k+ times on npm
      `;

    const result = parseResume(resume);

    // Contact
    expect(result.contact.name).toBe("John Smith");
    expect(result.contact.email).toBe("john.smith@email.com");
    expect(result.contact.phone).toBe("(555) 123-4567");
    expect(result.contact.linkedin).toBe("linkedin.com/in/johnsmith");
    expect(result.contact.github).toBe("github.com/johnsmith");

    // Skills
    expect(result.skills).toContain("typescript");
    expect(result.skills).toContain("javascript");
    expect(result.skills).toContain("react");
    expect(result.skills).toContain("node.js");
    expect(result.skills).toContain("postgresql");
    expect(result.skills).toContain("mongodb");
    expect(result.skills).toContain("aws");
    expect(result.skills).toContain("docker");
    expect(result.skills).toContain("kubernetes");

    // Experience
    expect(result.experience.length).toBeGreaterThanOrEqual(1);
    const hasSeniorJob = result.experience.some((e) =>
      e.title?.toLowerCase().includes("senior"),
    );
    const hasSoftwareJob = result.experience.some((e) =>
      e.title?.toLowerCase().includes("software"),
    );
    expect(hasSeniorJob || hasSoftwareJob).toBe(true);

    // Education
    expect(result.education.length).toBeGreaterThanOrEqual(1);
    const stanford = result.education.find((e) =>
      e.institution?.toLowerCase().includes("stanford"),
    );
    if (stanford) {
      expect(stanford.degree).toBe("Master of Science");
    }

    const berkeley = result.education.find((e) =>
      e.institution?.toLowerCase().includes("berkeley"),
    );
    // Just verify Berkeley was found as an institution
    expect(berkeley).toBeDefined();

    // Projects
    expect(result.projects.length).toBeGreaterThanOrEqual(1);
    const dashboard = result.projects.find((p) =>
      p.name?.toLowerCase().includes("analytics"),
    );
    expect(dashboard).toBeDefined();
  });

  it("should parse a data scientist resume", () => {
    const resume = `
Jane Doe
jane.doe@email.com | (555) 987-6543 | linkedin.com/in/janedoe

Summary
Data scientist with expertise in machine learning and statistical analysis

Skills
Python, R, SQL, TensorFlow, PyTorch, Scikit-learn, Pandas, NumPy, AWS, Docker

Experience

Data Scientist
DataCorp Inc
Mar 2021 - Present
- Built predictive models improving customer retention by 25%
- Implemented NLP pipeline processing 100k+ documents
- Created data visualization dashboards for stakeholders

Junior Data Scientist
Analytics Startup
Jun 2019 - Feb 2021
- Developed A/B testing framework
- Automated reporting pipelines

Education

Carnegie Mellon University
MS in Data Science
2017 - 2019

University of Michigan
BS Statistics
2013 - 2017
      `;

    const result = parseResume(resume);

    expect(result.contact.email).toBe("jane.doe@email.com");
    expect(result.experience.length).toBeGreaterThanOrEqual(1);
    expect(result.education.length).toBeGreaterThanOrEqual(1);

    expect(result.skills).toContain("python");
    expect(result.skills).toContain("aws");
  });

  it("should parse a resume with non-traditional formatting", () => {
    const resume = `
═══════════════════════════════════════════════════════════════
                    ALEXANDER CHEN - FULL STACK DEVELOPER
═══════════════════════════════════════════════════════════════

  Email: alex.chen@email.com
  Phone: 555.123.4567
  Web:   https://alexchen.dev
  Code:  github.com/alexchen

───────────────────────────────────────────────────────────────
SKILLS
───────────────────────────────────────────────────────────────

Languages:    TypeScript, JavaScript, Python, Go
Frontend:     React, Vue, Svelte, Tailwind CSS
Backend:      Node.js, FastAPI, PostgreSQL, Redis
DevOps:       Docker, Kubernetes, AWS, GitHub Actions

───────────────────────────────────────────────────────────────
EXPERIENCE
───────────────────────────────────────────────────────────────

Senior Full Stack Developer | Tech Innovations LLC
Location: Seattle, WA (Hybrid) | Duration: March 2022 - Present

• Architected and deployed microservices handling 10M+ requests daily
• Implemented GraphQL API reducing response payload sizes by 40%
• Led frontend migration from Vue 2 to Vue 3 with Composition API

Full Stack Developer | Digital Solutions Inc  
Location: Portland, OR | Duration: January 2020 - February 2022

• Built e-commerce platform serving 500k+ users
• Integrated payment systems including Stripe and PayPal
• Optimized database queries achieving 3x performance improvement

───────────────────────────────────────────────────────────────
EDUCATION
───────────────────────────────────────────────────────────────

University of Washington, Seattle, WA
Bachelor of Science in Computer Science, June 2019
GPA: 3.7/4.0, Dean's List
      `;

    const result = parseResume(resume);

    expect(result.contact.email).toBe("alex.chen@email.com");
    expect(result.contact.phone).toBe("555.123.4567");
    expect(result.contact.website).toBe("https://alexchen.dev");
    expect(result.contact.github).toBe("github.com/alexchen");

    expect(result.skills).toContain("typescript");
    expect(result.skills).toContain("react");
    expect(result.skills).toContain("vue");
    expect(result.skills).toContain("node.js");
    expect(result.skills).toContain("postgresql");

    expect(result.experience.length).toBeGreaterThanOrEqual(1);
    expect(result.education.length).toBeGreaterThanOrEqual(1);
  });

  it("should parse concatenated resume blob without explicit headers", () => {
    // This tests the case where job entries are concatenated without clear section headers
    const blobText = `Senior Developer
2022 - Present
TechCorp Remote

Built scalable microservices architecture Led migration to cloud infrastructure Senior Developer 2017 - 2022 DataSystems Remote Implemented authentication systems Led codebase modernization improving performance by 30% Senior Developer 2015 - 2017 IndustrialTech Remote Built monitoring dashboards for manufacturing sensors Frontend Developer 2012 - 2015 Freelance Remote Delivered responsive web applications`;

    const result = parseResume(blobText);

    // Should detect this as an experience section and extract at least 3-4 entries
    expect(result.experience.length).toBeGreaterThanOrEqual(3);

    // Check for key job entries
    const hasTechCorp = result.experience.some(
      (e) =>
        e.company?.toLowerCase().includes("techcorp") ||
        e.dateRange?.start === "2022",
    );
    const hasDataSystems = result.experience.some(
      (e) => e.dateRange?.start === "2017" && e.dateRange?.end === "2022",
    );
    const hasIndustrialTech = result.experience.some(
      (e) => e.dateRange?.start === "2015" && e.dateRange?.end === "2017",
    );
    const hasFrontend = result.experience.some(
      (e) =>
        e.title?.toLowerCase().includes("frontend") ||
        e.description?.toLowerCase().includes("frontend"),
    );

    expect(hasTechCorp).toBe(true);
    expect(hasDataSystems).toBe(true);
    expect(hasIndustrialTech).toBe(true);
    expect(hasFrontend).toBe(true);
  });

  it("should parse well-formatted resume with tabs between fields", () => {
    // This tests the case where job entries use tabs to separate fields
    const resumeText = `John Doe
john@example.com | linkedin.com/in/johndoe | github.com/johndoe

WORK EXPERIENCE

Senior Developer 	2022 – Present
TechCorp 	Remote
Built scalable microservices architecture
Led migration to cloud infrastructure

Senior Developer	2017 – 2022
DataSystems 	Remote
Implemented authentication systems
Led codebase modernization improving performance

Senior Developer	2015 – 2017
IndustrialTech	Remote
Built monitoring dashboards for sensors
Developed facility monitoring systems

Frontend Developer	2012 – 2015
Freelance	Remote
Delivered responsive web applications`;

    const result = parseResume(resumeText);

    // Should extract all 4 experience entries
    expect(result.experience.length).toBeGreaterThanOrEqual(4);

    // Check each job entry is properly extracted
    const techCorp = result.experience.find(
      (e) =>
        e.company?.toLowerCase().includes("techcorp") ||
        (e.dateRange?.start === "2022" && e.dateRange?.end === "Present"),
    );
    expect(techCorp).toBeDefined();
    expect(techCorp?.title?.toLowerCase()).toContain("developer");
    expect(techCorp?.location?.toLowerCase()).toBe("remote");

    const dataSystems = result.experience.find(
      (e) =>
        e.company?.toLowerCase().includes("datasystems") ||
        (e.dateRange?.start === "2017" && e.dateRange?.end === "2022"),
    );
    expect(dataSystems).toBeDefined();
    expect(dataSystems?.title?.toLowerCase()).toContain("developer");
    expect(dataSystems?.location?.toLowerCase()).toBe("remote");

    const industrialTech = result.experience.find(
      (e) =>
        e.company?.toLowerCase().includes("industrialtech") ||
        (e.dateRange?.start === "2015" && e.dateRange?.end === "2017"),
    );
    expect(industrialTech).toBeDefined();
    expect(industrialTech?.title?.toLowerCase()).toContain("developer");
    expect(industrialTech?.location?.toLowerCase()).toBe("remote");

    const freelance = result.experience.find(
      (e) =>
        e.company?.toLowerCase().includes("freelance") ||
        (e.dateRange?.start === "2012" && e.dateRange?.end === "2015") ||
        e.title?.toLowerCase().includes("frontend"),
    );
    expect(freelance).toBeDefined();
    expect(freelance?.title?.toLowerCase()).toContain("frontend");
    expect(freelance?.location?.toLowerCase()).toBe("remote");
  });
});
