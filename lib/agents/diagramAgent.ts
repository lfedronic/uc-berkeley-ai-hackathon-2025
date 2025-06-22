import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

export interface DiagramRequest {
  concept: string;
  type?: 'flowchart' | 'mindmap' | 'sequence' | 'class' | 'timeline' | 'auto';
  complexity?: 'simple' | 'detailed' | 'comprehensive';
}

export interface GeneratedDiagram {
  title: string;
  concept: string;
  type: string;
  mermaidCode: string;
  description: string;
}

export async function generateDiagram(request: DiagramRequest): Promise<GeneratedDiagram> {
  const { concept, type = 'auto', complexity = 'detailed' } = request;

  const prompt = `Create a Mermaid diagram for the concept: "${concept}".

REQUIREMENTS:
- Generate valid Mermaid syntax that will render properly
- Choose the most appropriate diagram type${type !== 'auto' ? ` (specifically: ${type})` : ''}
- Make it ${complexity} level complexity
- Use proper Mermaid syntax with correct node IDs and connections
- Wrap all text in double quotes
- Use <br/> for line breaks in text
- Do not use custom colors or beta features
- Do not use ::: syntax

MERMAID SYNTAX REFERENCE:

## Flowchart
flowchart TD
    A["Start"] --> B{"Decision?"}
    B -->|"Yes"| C["Action 1"]
    B -->|"No"| D["Action 2"]
    C --> E["End"]
    D --> E

## Sequence Diagram
sequenceDiagram
    participant A as "Alice"
    participant B as "Bob"
    A->>B: "Hello Bob, how are you?"
    B-->>A: "Great!"
    A->>B: "See you later!"

## Class Diagram
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
        +move()
    }
    class Dog {
        +String breed
        +bark()
    }
    Animal <|-- Dog

## State Diagram
stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]

## Entity Relationship Diagram
erDiagram
    CUSTOMER ||--o{ ORDER : "places"
    ORDER ||--|{ LINE-ITEM : "contains"
    CUSTOMER {
        string name
        string custNumber
        string sector
    }
    ORDER {
        int orderNumber
        string deliveryAddress
    }

## User Journey
journey
    title "My working day"
    section "Go to work"
      "Make tea": 5: "Me"
      "Go upstairs": 3: "Me"
      "Do work": 1: "Me", "Cat"
    section "Go home"
      "Go downstairs": 5: "Me"
      "Sit down": 5: "Me"

## Gantt Chart
gantt
    title "A Gantt Diagram"
    dateFormat  YYYY-MM-DD
    section "Section"
    "A task"           :a1, 2014-01-01, 30d
    "Another task"     :after a1  , 20d
    section "Another"
    "Task in sec"      :2014-01-12  , 12d
    "another task"      : 24d

## Pie Chart
pie title "Pets adopted by volunteers"
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15

## Quadrant Chart
quadrantChart
    title "Reach and influence"
    x-axis "Low Reach" --> "High Reach"
    y-axis "Low Influence" --> "High Influence"
    quadrant-1 "We should expand"
    quadrant-2 "Need to promote"
    quadrant-3 "Re-evaluate"
    quadrant-4 "May be improved"
    "Campaign A": [0.3, 0.6]
    "Campaign B": [0.45, 0.23]

## Requirement Diagram
requirementDiagram
    requirement test_req {
    id: 1
    text: "the test text."
    risk: high
    verifymethod: test
    }
    element test_entity {
    type: simulation
    }
    test_entity - satisfies -> test_req

## GitGraph
gitgraph
    commit
    commit
    branch develop
    commit
    commit
    checkout main
    commit
    merge develop

## C4 Diagram
C4Context
    title "System Context diagram for Internet Banking System"
    Enterprise_Boundary(b0, "BankBoundary0") {
        Person(customerA, "Banking Customer A", "A customer of the bank")
        System(SystemAA, "Internet Banking System", "Allows customers to view information about their bank accounts")
    }
    System_Ext(SystemE, "E-mail system", "The internal Microsoft Exchange e-mail system")
    Rel(customerA, SystemAA, "Uses")

## Mindmap
mindmap
  root))"mindmap"((
    "Origins"
      "Long history"
      "Popularisation"
        "British popular psychology author Tony Buzan"
    "Research"
      "On effectiveness<br/>and features"
      "On Automatic creation"
        "Uses"
            "Creative techniques"
            "Strategic planning"

## Timeline
timeline
    title "History of Social Media Platform"
    2002 : "LinkedIn"
    2004 : "Facebook"
         : "Google"
    2005 : "Youtube"
    2006 : "Twitter"

## ZenUML
zenuml
    title "Order Service"
    @Actor Customer
    @Boundary OrderController
    @Entity OrderService
    Customer->OrderController: "POST /orders"
    OrderController->OrderService: "createOrder()"
    OrderService->OrderController: "Order"
    OrderController->Customer: "201 Created"

## Sankey Diagram
sankey-beta
    "Electricity grid","Over generation / exports",104.453
    "Electricity grid","Heating and cooling - homes",113.726
    "Electricity grid","H2 conversion",27.14

## XY Chart
xychart-beta
    title "Sales Revenue"
    x-axis ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
    y-axis "Revenue (in $)" 4000 --> 11000
    bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
    line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]

## Block Diagram
block-beta
    columns 1
    db(("DB"))
    blockArrowId6<["&nbsp;&nbsp;&nbsp;"]>(down)
    block:ID
        A
        B["A wide one in the middle"]
        C
    end

## Packet Diagram
packet-beta
    title "UDP Packet"
    0-15: "Source Port"
    16-31: "Destination Port"
    32-47: "Length"
    48-63: "Checksum"
    64-95: "Data (variable length)"

## Kanban
kanban
    "Todo"
        ["Item 1"]
        ["Item 2"]
    "Doing"
        ["Item 3"]
    "Done"
        ["Item 4"]
        ["Item 5"]

## Architecture
architecture-beta
    group api(cloud)["API"]
    
    service db(database)["Database"] in api
    service disk1(disk)["Storage"] in api
    service disk2(disk)["Storage"] in api
    service server(server)["Server"] in api

    db:L -- R:server
    disk1:T -- B:server
    disk2:T -- B:db

## Radar Chart
radar
    title "SWOT Analysis"
    radar-chart
        "Technology": 0.8
        "Marketing": 0.6
        "Finance": 0.7
        "Operations": 0.9
        "HR": 0.5

DIAGRAM TYPES TO CHOOSE FROM:
- flowchart: For processes, workflows, decision trees
- mindmap: For concept relationships, brainstorming
- sequence: For interactions, communications, protocols  
- class: For object relationships, system architecture
- timeline: For historical events, project phases
- graph: For networks, dependencies, relationships
- erDiagram: For database relationships, data models
- journey: For user experiences, process flows
- gantt: For project timelines, schedules
- pie: For data distribution, proportions
- quadrantChart: For analysis frameworks, positioning
- requirementDiagram: For system requirements, specifications
- gitgraph: For version control flows, branching
- C4Context: For system architecture, boundaries
- zenuml: For sequence diagrams with UML
- sankey-beta: For flow diagrams, energy/data flows
- xychart-beta: For data visualization, trends
- block-beta: For system blocks, components
- packet-beta: For network protocols, data structures
- kanban: For workflow management, task boards
- architecture-beta: For system architecture, infrastructure
- radar: For multi-dimensional analysis, comparisons

COMPLEXITY LEVELS:
- simple: 3-5 main elements
- detailed: 6-12 elements with relationships
- comprehensive: 12+ elements with detailed connections

Please respond with a JSON object containing:
{
  "title": "Clear title for the diagram",
  "concept": "${concept}",
  "type": "chosen_diagram_type",
  "mermaidCode": "valid mermaid syntax here",
  "description": "Brief explanation of what the diagram shows and how to read it"
}

Make sure the mermaidCode is valid and will render without errors. Choose the most appropriate diagram type for "${concept}".`;

  try {
    const result = await generateText({
      model: google('gemini-1.5-flash'),
      prompt,
      maxTokens: 1500,
      temperature: 0.7,
    });

    // Parse the JSON response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const diagramData = JSON.parse(jsonMatch[0]);
    
    // Validate required fields
    if (!diagramData.mermaidCode || !diagramData.title) {
      throw new Error('Missing required fields in diagram response');
    }

    return {
      title: diagramData.title,
      concept: concept,
      type: diagramData.type || 'flowchart',
      mermaidCode: diagramData.mermaidCode,
      description: diagramData.description || 'Educational diagram'
    };

  } catch (error) {
    console.error('Error generating diagram:', error);
    
    // Fallback simple diagram
    return {
      title: `${concept} Overview`,
      concept: concept,
      type: 'flowchart',
      mermaidCode: `flowchart TD
    A["${concept}"] --> B["Key Concepts"]
    A --> C["Applications"]
    A --> D["Examples"]
    B --> E["Learn More"]
    C --> E
    D --> E`,
      description: `A simple overview diagram for ${concept} showing key concepts, applications, and examples.`
    };
  }
}
