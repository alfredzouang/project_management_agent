# Project Description

**Project Name:** MCCVB Creative and Media Buying Agency Services  
**Customer:** Monterey County Convention & Visitors Bureau (MCCVB)  
**Estimated Start Date:** 2021-07-26  
**Estimated Finish Date:** 2022-06-30  
**Estimated Total Cost:** $240,000  
**Project Type:** IDG - Agency Services

**Description:**  
The Monterey County Convention & Visitors Bureau (MCCVB) seeks a full-service agency to provide creative and media buying services to develop the Monterey County brand and promote tourism. The agency will develop and execute integrated marketing programs aimed at driving overnight visitation and enhancing Monterey County's reputation as a premier tourism destination. The scope encompasses strategy, creative development, media planning and buying, content planning, reporting, analytics, research, and account support. Collaboration with MCCVB’s Marketing Communications team and other agencies is key. The initial term is July 26, 2021 to June 30, 2022, with potential extensions.

---

# Task List Table

| id  | name                                     | description                                                                                                                            | outline_level | dependent_tasks      | parent_task | child_tasks           | estimated_effort_in_hours | status       | required_skills                      | assigned_to         |
|-----|------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|---------------|---------------------|-------------|----------------------|--------------------------|--------------|---------------------------------------|---------------------|
| 1   | Project Kickoff and Stakeholder Alignment| Conduct a kickoff meeting with MCCVB and key stakeholders to align on objectives, deliverables, timelines, and communication protocols. | 1             |                     |             | 2, 3                 | 8                        | Not Started  | Project Management, Facilitation      | Senior Project Manager |
| 2   | Brand and Market Research                | Conduct research to understand current brand perception, target audience, competition, and trends.                                     | 2             | 1                   | 1           | 4, 5                 | 32                       | Not Started  | Market Research, Data Analysis        | Market Research Analyst |
| 3   | Establish Project Management Framework   | Set up project management tools, templates, and communication cadence for collaboration.                                               | 2             | 1                   | 1           |                      | 12                       | Not Started  | Project Management                    | Project Coordinator     |
| 4   | Strategy Development                     | Develop an integrated marketing strategy and present for approval.                                                                     | 3             | 2                   | 2           | 6, 7                 | 24                       | Not Started  | Marketing Strategy                    | Marketing Strategist    |
| 5   | Content Audit and Planning               | Audit existing content and create a content plan; present for approval.                                                                | 3             | 2                   | 2           | 8, 9, 10             | 20                       | Not Started  | Content Strategy                      | Content Strategist      |
| 6   | Develop and Present Creative Campaign Concepts | Create and present at least three campaign concepts; secure final selection.                                                     | 4             | 4                   | 4           | 11                   | 24                       | Not Started  | Creative Direction, Copywriting, Design | Creative Director   |
| 7   | Media Planning                           | Develop a detailed media plan and present for approval.                                                                               | 4             | 4                   | 4           | 12                   | 24                       | Not Started  | Media Planning                         | Media Planner        |
| 8   | Write Campaign Copy                      | Write all campaign copy as outlined in the content plan.                                                                              | 4             | 5                   | 5           |                      | 16                       | Not Started  | Copywriting                           | Copywriter           |
| 9   | Create Social Media Images               | Design and produce all social media image assets needed for campaign.                                                                  | 4             | 5                   | 5           |                      | 12                       | Not Started  | Design                                 | Graphic Designer      |
| 10  | Produce Campaign Videos                  | Produce video content for digital and social campaigns.                                                                               | 4             | 5                   | 5           |                      | 20                       | Not Started  | Video Production                       | Video Producer        |
| 11  | Creative Asset Production                | Produce final creative assets based on approved concepts and content.                                                                  | 5             | 6, 8, 9, 10         | 6           |                      | 32                       | Not Started  | Design, Production                     | Asset Producer        |
| 12  | Media Buying and Placement               | Purchase and place media as per the media plan; confirm placements.                                                                   | 5             | 7, 11               | 7           | 13                   | 32                       | Not Started  | Media Buying                           | Media Buyer           |
| 13  | Campaign Launch and Monitoring           | Launch and monitor the campaign, optimizing performance as needed.                                                                    | 6             | 12                  | 12          | 14                   | 24                       | Not Started  | Campaign Management, Analytics          | Campaign Manager      |
| 14  | Reporting and Analytics                  | Collect, analyze, and report on campaign performance; provide recommendations.                                                        | 7             | 13                  | 13          | 15                   | 20                       | Not Started  | Analytics, Reporting                    | Analytics & Reporting Specialist |
| 15  | Project Closeout and Lessons Learned     | Conduct project closeout, document lessons, and archive materials.                                                                   | 8             | 14                  | 14          |                      | 8                        | Not Started  | Project Management                      | Senior Project Manager |

---

# Task Gantt Diagram

```mermaid
gantt
    dateFormat  YYYY-MM-DD
    axisFormat  %b %d

    section Project Initiation
    Project Kickoff and Stakeholder Alignment    :a1, 2021-07-26, 8d

    section Research & Framework
    Brand and Market Research                    :a2, after a1, 32d
    Establish Project Management Framework       :a3, after a1, 12d

    section Planning
    Strategy Development                        :a4, after a2, 24d
    Content Audit and Planning                   :a5, after a2, 20d

    section Creative Development
    Dev. & Present Creative Campaign Concepts    :a6, after a4, 24d
    Media Planning                              :a7, after a4, 24d

    section Content Creation
    Write Campaign Copy                         :a8, after a5, 16d
    Create Social Media Images                  :a9, after a5, 12d
    Produce Campaign Videos                     :a10, after a5, 20d

    section Asset Production & Media
    %% Creative Asset Production starts after all of: a6, a8, a9, a10
    Creative Asset Production                   :a11, after a6, after a8, after a9, after a10, 32d
    %% Media Buying and Placement starts after both a7 and a11
    Media Buying and Placement                  :a12, after a7, after a11, 32d

    section Campaign Execution
    Campaign Launch and Monitoring              :a13, after a12, 24d

    section Reporting & Closure
    Reporting and Analytics                     :a14, after a13, 20d
    Project Closeout and Lessons Learned        :a15, after a14, 8d
```

---

> **Note:**  
Effort in hours is shown for each task, but for Gantt the durations are distributed sequentially based on dependencies. Actual calendar scheduling may adjust based on resource allocation and parallelization.

If a more detailed schedule with assigned dates or parallel work is required, please specify!
