' Runs worker.cmd with no console window, so the 5-minute Task Scheduler run doesn't pop up on screen.
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
CreateObject("WScript.Shell").Run """" & dir & "\worker.cmd""", 0, True
