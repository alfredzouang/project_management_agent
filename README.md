# Project Management Agents

## Project Purpose

The project aims to develop an agent system capable of transforming project descriptions into actionable tasks and organizing the project plan. This system will streamline project management by automating task creation and planning. Future enhancements will include resource management and document generation capabilities.

## Project Architecture

### Core Components
- **Agent System**: The core functionality revolves around the agent system that interprets project descriptions and generates tasks.
- **Task Management**: Organizes tasks into a coherent project plan.

### Future Features
- **Resource Management**: Plan to integrate features for managing project resources.
- **Document Generation**: Automate the creation of project-related documents.

### Project Structure
- **Agents**: Located in `src/agents/`, these files define the logic for task conversion and planning.
- **Processes**: Located in `src/processes/`, these files manage the steps and events in the project lifecycle.

## Example Output

The project output includes a detailed task list and a Gantt chart that outlines the development timeline for the "SnakeEatEggsGameProject." Below is an example of the project's output:

### Project Description
- **Project Name:** SnakeEatEggsGameProject
- **Description:** This project is about creating a snake eat eggs game, encompassing aspects of game design, mechanics development, asset creation, integration, testing, and refinement. The project is a software development endeavor scheduled to span from May 8, 2024, to July 8, 2024.

### Task List Table

| id       | name                      | description                                                                 | outline_level | dependent_tasks    | parent_task | child_tasks        | status              | estimated_effort_in_hours |
|----------|---------------------------|-----------------------------------------------------------------------------|---------------|--------------------|-------------|--------------------|---------------------|----------------------------|
| task_1   | Game Design Document Creation | Create a comprehensive game design document outlining gameplay mechanics, rules, and objectives. | 1             | null               | null        | task_2, task_3    | Initial planning phase | 20                      |
| task_2   | Game Mechanics Design      | Design the core mechanics of the snake and egg interaction.                | 2             | task_1             | task_1      | null              | Detailed mechanics design | 30                      |
| task_3   | Game Art Design            | Create the visual assets for the game, including the snake, eggs, and background. | 2          | task_1             | task_1      | task_4            | Art asset creation  | 40                      |
| task_4   | Animation Development      | Develop animations for the snake and egg interactions.                     | 3             | task_3             | task_3      | null              | Animation creation  | 25                      |
| task_5a  | Game Mechanics Integration | Integrate the designed game mechanics into the game engine.                | 1             | task_2             | null        | null              | Mechanics integration phase | 25                      |
| task_5b  | Visual Asset Integration   | Integrate the visual assets and animations into the game engine.           | 1             | task_3, task_4     | null        | null              | Asset integration phase | 25                      |
| task_6   | Collision Detection Implementation | Develop the collision detection system for the snake and eggs.           | 1             | task_5a            | null        | null              | Collision system development | 20                      |
| task_7   | Score and Level System     | Implement the scoring and level progression system.                        | 1             | task_5a            | null        | null              | Scoring system development | 30                      |
| task_8a  | Unit Testing               | Perform unit testing on individual components of the game.                 | 1             | task_5a, task_5b   | null        | null              | Component testing phase | 15                      |
| task_8b  | Integration Testing        | Test the integration of game mechanics and visual assets.                  | 1             | task_8a            | null        | null              | System integration testing | 15                      |
| task_8c  | User Acceptance Testing    | Conduct user acceptance testing to ensure gameplay meets expectations.     | 1             | task_8b            | null        | null              | Gameplay validation | 10                      |

### Task Gantt Diagram

```mermaid
gantt
    dateFormat  YYYY-MM-DD
    title       SnakeEatEggs Game Development Timeline
    excludes    weekends
    
    section Design Phase
    Game Design Document Creation :done, task_1, 2024-05-08, 4d
    Game Mechanics Design         :done, task_2, after task_1, 6d
    Game Art Design               :done, task_3, after task_1, 8d
    Animation Development         :done, task_4, after task_3, 5d

    section Integration Phase
    Game Mechanics Integration    :active, task_5a, after task_2, 6d
    Visual Asset Integration      :active, task_5b, after task_3 task_4, 8d
    
    section Development Phase
    Collision Detection Implementation :task_6, after task_5a, 5d
    Score and Level System             :task_7, after task_5a, 6d

    section Testing Phase
    Unit Testing                  :task_8a, after task_5a task_5b, 3d
    Integration Testing           :task_8b, after task_8a, 3d
    User Acceptance Testing       :task_8c, after task_8b, 2d
