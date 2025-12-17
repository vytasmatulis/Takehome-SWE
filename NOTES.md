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

Loading clientside things before waiting for a response.

Used the streaming code given. Assistant response is only saved to db on failure/client closing.

I was also having some issues with SSE timing out which i think was because the openai request would take too long. So I added some ping events
to make sure that it did not time out before getting the real chunk events.

Nothing very super complex on the frontend.

## What I'd Do Differently

Move out some of the api logic into own functions so that it can be reused in other api calls. Ex: db calls that may be reused.

Would probably refactor to have a page system on the frontend.

I would also implement the title change and make new chats temporary.

Deleting conversations should be implemented.

Also does not handle cancelling messages.

Some of these are marked in comments with //TODO Vytas.

## Time Spent

About 3.5 hours tuesday and 1 hour wednesday (4.5 total).

## Questions or Feedback

Was fun to build something that actually did stuff
