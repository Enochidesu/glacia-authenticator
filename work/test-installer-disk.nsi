Unicode true
RequestExecutionLevel user
SilentInstall silent
OutFile "installer-test-native-build\disk-check.exe"
!include FileFunc.nsh
!include LogicLib.nsh
!define APP_64_UNPACKED_SIZE 378713
!include installer-space.nsh
Section
  FileOpen $3 "installer-test-native-build\disk-check.txt" w
  ${GetRoot} "F:\Glacia Authenticator" $0
  FileWrite $3 "root=$0$\r$\n"
  ClearErrors
  ${DriveSpace} "$0" "/D=F /S=K" $1
  FileWrite $3 "freeKB=$1$\r$\n"
  System::Int64Op $1 < 378713
  Pop $2
  FileWrite $3 "tooSmall=$2$\r$\n"
  System::Call 'kernel32::GetDiskFreeSpaceExW(w "F:\", *l .r4, p 0, p 0) i.r5'
  FileWrite $3 "directBytes=$4 success=$5$\r$\n"
  System::Int64Op $4 < 387802112
  Pop $6
  FileWrite $3 "directTooSmall=$6$\r$\n"
  StrCpy $INSTDIR "F:\Glacia Authenticator"
  Call GlaciaCheckSpace
  FileWrite $3 "sharedStatus=$GlaciaSpaceStatus freeMB=$GlaciaFreeMB requiredMB=$GlaciaRequiredMB$\r$\n"
  ${If} $GlaciaSpaceStatus != "ok"
    SetErrorLevel 1
  ${EndIf}
  StrCpy $GlaciaFreeMB 369
  StrCpy $GlaciaRequiredMB 370
  Call GlaciaEvaluateSpace
  FileWrite $3 "belowRequired=$GlaciaSpaceStatus$\r$\n"
  ${If} $GlaciaSpaceStatus != "insufficient"
    SetErrorLevel 1
  ${EndIf}
  StrCpy $GlaciaFreeMB 370
  Call GlaciaEvaluateSpace
  FileWrite $3 "atRequired=$GlaciaSpaceStatus$\r$\n"
  ${If} $GlaciaSpaceStatus != "ok"
    SetErrorLevel 1
  ${EndIf}
  StrCpy $GlaciaFreeMB 47562
  Call GlaciaEvaluateSpace
  FileWrite $3 "largeDrive=$GlaciaSpaceStatus$\r$\n"
  ${If} $GlaciaSpaceStatus != "ok"
    SetErrorLevel 1
  ${EndIf}
  FileClose $3
SectionEnd
