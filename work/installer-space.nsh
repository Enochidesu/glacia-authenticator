!include LogicLib.nsh
!include FileFunc.nsh
Var GlaciaFreeMB
Var GlaciaRequiredMB
Var GlaciaSpaceStatus

; Dedicated variables prevent Windows API result registers from overwriting
; the free-space value while the directory page checks its result.
Function GlaciaEvaluateSpace
  Push $0
  System::Int64Op $GlaciaFreeMB < $GlaciaRequiredMB
  Pop $0
  StrCpy $GlaciaSpaceStatus "ok"
  ${If} $0 == 1
    StrCpy $GlaciaSpaceStatus "insufficient"
  ${EndIf}
  Pop $0
FunctionEnd

Function GlaciaCheckSpace
  Push $0
  Push $1
  Push $2
  StrCpy $GlaciaSpaceStatus "unavailable"
  ${GetRoot} "$INSTDIR" $0
  StrCpy $0 "$0\"
  System::Call 'kernel32::GetDiskFreeSpaceExW(w r0, *l .r1, p 0, p 0) i.r2'
  ${If} $2 != 0
    System::Int64Op $1 / 1048576
    Pop $GlaciaFreeMB
    IntOp $GlaciaRequiredMB ${APP_64_UNPACKED_SIZE} + 1023
    IntOp $GlaciaRequiredMB $GlaciaRequiredMB / 1024
    Call GlaciaEvaluateSpace
  ${EndIf}
  Pop $2
  Pop $1
  Pop $0
FunctionEnd
