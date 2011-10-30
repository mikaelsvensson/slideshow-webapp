In order to show presentations in a distributed manner, meaning that 
multiple clients (computers) can look at the same slideshow while it 
is "running", requires a simple messaging system.

When one user starts a presentations all other users should be notified
about this. They should then be able to "join" the presentation so
that they see the same slides as the presenter does. When the presenter
changes slides, all viewers (clients who have joined the presentation)
will also change to the same slide.

Viewers (the audience) should be able to add comments to the slides 
shown and these comments should be visible, more or less, instantaneously
to all other viewers.

The messaging infrastructure has these features/requirements:
 - A channel is an ordered list of messages.
 - A message is a text string (most likely a serialized JSON-structure)
 - A target is the intended recipient(s) of a message
 - Each client (audience and/or presenter) sends messages to and receives
   messages from one, and only one, channel.
 - Clients listens for new messages by continuously polling the messaging
   system for updates. Each request contains the channel name, the target 
   and the message id of the last received message. The messaging system 
   responds with all messages which have arrived for the specified target
   "since the specified message id".
   
Proposed message types (operations):
 - annotation-add-comment(author, text)
 - annotation-add-speechballoon(author, text, coord)
 - annotation-add-stamp(author, shape, coord, size)
 - annotation-remove(id)
 - slide-goto(id)
 - slide-update(slideDefinition)
 - slideshow-start(title)
 - slideshow-end(id)
 - slideshow-join(id)
