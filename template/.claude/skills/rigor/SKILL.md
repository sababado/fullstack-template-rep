---
name: rigor
description: A correction from the user to stop cutting corners. Stop, find what was assumed instead of verified, trace the root cause, and redo the current task properly. Run it when the agent is being hasty or guessing.
argument-hint: "[what went wrong]"
disable-model-invocation: true
---

# Rigor

The user is telling you to stop cutting corners and do the work properly. This is a
correction, not a request for new features. You were being hasty: assuming without
verifying, patching symptoms instead of causes, or answering confidently without reading
the code.

1. **Stop.** Don't continue what you were doing, and don't defend your previous approach.
2. **Name what you got wrong.** Re-read the relevant code, docs, or error output. State
   what you assumed and what is actually true. If you don't know what you got wrong, say
   so and investigate before you go on.
3. **Trace the full picture.** Follow the data flow end to end. Read every file in the
   chain. Check each assumption against the code. Don't skip a layer because you think
   you know what it does.
4. **Find the right fix, not the fast fix.** The right fix addresses the root cause. If
   the cause is in file A and the symptom shows up in file B, fix A. If fixing A means
   updating B, C, and a guide, do all of it.
5. **Verify before you answer.** No "I believe", "I think", or "it should be". Read the
   code, search for the function, check the config, run the check. Then state facts.
6. **Go back to the task.** Resume whatever you were working on, with this rigor. The
   user's added context, if any:

$ARGUMENTS
