# Implementation Notes

## What I Built

Implemented all these api endpoints
Some are not used yet

GET	/api/chats	List all conversations
POST	/api/chats	Create new conversation
GET	/api/chats/:id	Get single conversation
PATCH	/api/chats/:id	Update conversation (title)
DELETE	/api/chats/:id	Delete conversation
GET	/api/chats/:id/messages	Get messages for conversation
POST	/api/chats/:id/messages	Send message, stream AI response (SSE)

Implemented streaming conversation on the frontend. Backend just fetches the response as a full response.

Implemented the UI for loading conversations and creating new ones

Implemented retrying for last failed message if you have none after

## Technical Decisions

Retry logic just sends the message with history again through to stream the response.

## What I'd Do Differently

Move out some of the api logic into own functions so that it can be reused in other api calls. Ex: db calls that may be reused.
Some minor bugs that had to be bandaid fixed should be actually fixed. 

Would probably refactor to have a page system.

I would also implement the title change and make new chats temporary.

Also deleting conversations should be implemented.

Also does not handle cancelling messages.

## Time Spent

About 3.5 hours tuesday and 1 hour wednesday (4.5 total).

## Questions or Feedback

[Any questions you have, or feedback on the challenge itself]
