' Runs worker.cmd with no console window, passing its arguments (e.g. --watch). Task Scheduler starts it at logon.
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
args = ""
For Each a In WScript.Arguments
  args = args & " " & a
Next
CreateObject("WScript.Shell").Run """" & dir & "\worker.cmd""" & args, 0, True
