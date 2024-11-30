# Goals
- editable documents in defined languages
- bootstrap on itself
    - TypeScript language
    - generator (basics needed for bootstrap)
- modularized
    - IdeaTree
        - structure
        - strorage
        - IdeaTree colaboration sync features
    - grammar level representations
        - tokenized syntax tree in the spirit of Harmonia / Tree Sitter
# TODO: 
## Editor
- Cursor notion
    - on document level
        - node, where the token is
        - the token def src
    - on token level
## Architecture
- convert projet to use vite
- visual architectural schema
- textual LLM-like goals, which defines requirements, so the emerging AI can generate the whole thing

# MAYBE:
- revise ConceptMemberType, if the isOptional field is the right representation, in opposition to a generic an `Optional`type which would wrap an `INonOptional` trait
- convert to use pnpm
- ArraySetImplementation as an abstract base class; or replace by nativ Set ? - do some perf test?