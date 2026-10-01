; Project-owned additions to electron-builder's assisted installer.
!ifndef BUILD_UNINSTALLER
  !include MUI2.nsh
  !include nsDialogs.nsh
  !include FileFunc.nsh
  !include "${BUILD_RESOURCES_DIR}\..\installer-space.nsh"

  !define MUI_LICENSEPAGE_CHECKBOX
  !define MUI_LICENSEPAGE_TEXT_TOP "Please review Glacia's Terms of Use and Apache 2.0 software license."
  !define MUI_LICENSEPAGE_TEXT_BOTTOM "Select the checkbox to accept and continue."
  !define MUI_LICENSEPAGE_CHECKBOX_TEXT "I accept the Terms of Use and Software License"

  Var GlaciaDesktopCheckbox
  Var GlaciaCreateDesktop
  Var GlaciaOptionsDialog
  Var GlaciaDirectoryDialog
  Var GlaciaDirectoryEdit
  Var GlaciaBrowseButton
  ; Replace the standard page through the existing custom-page hook. The
  ; standard page can mutate $INSTDIR during its validation callback.
  !ifdef allowToChangeInstallationDirectory
    !undef allowToChangeInstallationDirectory
  !endif

  ; Compare the final folder name, rather than accepting a matching substring
  ; anywhere in the parent path. This also protects silent /D installations.
  Function GlaciaNormalizeDirectory
    Push $0
    Push $1
    GetFullPathName $INSTDIR "$INSTDIR"
    glacia_trim:
      StrLen $0 $INSTDIR
      ${If} $0 > 3
        StrCpy $1 $INSTDIR 1 -1
        ${If} $1 == "\"
          StrCpy $INSTDIR $INSTDIR -1
          Goto glacia_trim
        ${EndIf}
      ${EndIf}
    ${GetFileName} "$INSTDIR" $0
    ${If} $0 != "${PRODUCT_NAME}"
      StrCpy $1 $INSTDIR 1 -1
      ${If} $1 == "\"
        StrCpy $INSTDIR "$INSTDIR${PRODUCT_NAME}"
      ${Else}
        StrCpy $INSTDIR "$INSTDIR\${PRODUCT_NAME}"
      ${EndIf}
    ${EndIf}
    Pop $1
    Pop $0
  FunctionEnd

  !macro customInit
    StrCpy $GlaciaCreateDesktop ${BST_UNCHECKED}
    ; Optional explicit choice for managed/silent installs; otherwise off.
    ${GetParameters} $0
    ClearErrors
    ${GetOptions} $0 "/DESKTOPSHORTCUT=" $1
    ${IfNot} ${Errors}
    ${AndIf} $1 == "1"
      StrCpy $GlaciaCreateDesktop ${BST_CHECKED}
    ${EndIf}
    ClearErrors
    Call GlaciaNormalizeDirectory
  !macroend

  !macro customPageAfterChangeDir
    Page custom GlaciaDirectoryPage GlaciaDirectoryLeave
    Page custom GlaciaOptionsPage GlaciaOptionsLeave
  !macroend

  Function GlaciaDirectoryPage
    !insertmacro MUI_HEADER_TEXT "Choose Install Location" "Choose a drive or folder for Glacia Authenticator."
    nsDialogs::Create 1018
    Pop $GlaciaDirectoryDialog
    ${If} $GlaciaDirectoryDialog == error
      Abort
    ${EndIf}
    ${NSD_CreateLabel} 0 0 100% 36u "Choose where to install Glacia. The installer uses a dedicated Glacia Authenticator folder inside your selected location."
    Pop $0
    ${NSD_CreateLabel} 0 50u 100% 12u "Destination folder:"
    Pop $0
    ${NSD_CreateText} 0 68u 78% 14u "$INSTDIR"
    Pop $GlaciaDirectoryEdit
    ${NSD_CreateButton} 80% 68u 20% 14u "Browse..."
    Pop $GlaciaBrowseButton
    ${NSD_OnClick} $GlaciaBrowseButton GlaciaBrowseFolder
    ${NSD_CreateLabel} 0 98u 100% 34u "Selecting an existing Glacia Authenticator folder uses it directly. Your app files stay together in that folder."
    Pop $0
    IntOp $0 ${APP_64_UNPACKED_SIZE} + 1023
    IntOp $0 $0 / 1024
    ${NSD_CreateLabel} 0 124u 100% 14u "Space required: about $0 MB"
    Pop $0
    nsDialogs::Show
  FunctionEnd

  Function GlaciaBrowseFolder
    Pop $0
    ${NSD_GetText} $GlaciaDirectoryEdit $INSTDIR
    nsDialogs::SelectFolderDialog "Choose a drive or folder for Glacia Authenticator" "$INSTDIR"
    Pop $0
    ${If} $0 != error
    ${AndIf} $0 != ""
      StrCpy $INSTDIR $0
      Call GlaciaNormalizeDirectory
      ${NSD_SetText} $GlaciaDirectoryEdit "$INSTDIR"
    ${EndIf}
  FunctionEnd

  Function GlaciaDirectoryLeave
    ${NSD_GetText} $GlaciaDirectoryEdit $INSTDIR
    System::Call 'shlwapi::PathIsRelativeW(w "$INSTDIR") i.r0'
    ${If} $INSTDIR == ""
    ${OrIf} $0 != 0
      MessageBox MB_OK|MB_ICONEXCLAMATION "Choose a drive or enter a full folder path."
      Abort
    ${EndIf}
    Call GlaciaNormalizeDirectory
    Call GlaciaCheckSpace
    ${If} $GlaciaSpaceStatus == "unavailable"
      MessageBox MB_OK|MB_ICONEXCLAMATION "This drive is unavailable. Choose another installation location."
      Abort
    ${EndIf}
    ${If} $GlaciaSpaceStatus == "insufficient"
      MessageBox MB_OK|MB_ICONEXCLAMATION "This location has $GlaciaFreeMB MB available, but Glacia needs $GlaciaRequiredMB MB. Choose another drive or free up some space."
      Abort
    ${EndIf}
  FunctionEnd

  Function GlaciaOptionsPage
    Call GlaciaNormalizeDirectory
    !insertmacro MUI_HEADER_TEXT "Installation options" "Choose your desktop shortcut preference."
    nsDialogs::Create 1018
    Pop $GlaciaOptionsDialog
    ${If} $GlaciaOptionsDialog == error
      Abort
    ${EndIf}
    ${NSD_CreateCheckbox} 0 0 100% 14u "Create shortcut on desktop"
    Pop $GlaciaDesktopCheckbox
    ${NSD_SetState} $GlaciaDesktopCheckbox $GlaciaCreateDesktop
    ${NSD_CreateLabel} 0 30u 100% 20u "Glacia will be installed in:"
    Pop $0
    ${NSD_CreateLabel} 0 52u 100% 44u "$INSTDIR"
    Pop $0
    ${NSD_CreateLabel} 0 108u 100% 30u "Your selected location contains a dedicated Glacia Authenticator folder."
    Pop $0
    nsDialogs::Show
  FunctionEnd

  Function GlaciaOptionsLeave
    ${NSD_GetState} $GlaciaDesktopCheckbox $GlaciaCreateDesktop
  FunctionEnd

  !macro customInstall
    ${If} $GlaciaCreateDesktop == ${BST_CHECKED}
      CreateShortCut "$newDesktopLink" "$appExe" "" "$appExe" 0 "" "" "${APP_DESCRIPTION}"
      WinShell::SetLnkAUMI "$newDesktopLink" "${APP_ID}"
      System::Call 'Shell32::SHChangeNotify(i 0x8000000, i 0, i 0, i 0)'
    ${EndIf}
  !macroend
!endif

; The built-in desktop shortcut is disabled so the custom checkbox controls
; creation. Its corresponding built-in cleanup is disabled too, so remove
; our optional shortcut explicitly while respecting upgrade preservation.
!macro customUnInstall
  ${IfNot} ${isKeepShortcuts}
    WinShell::UninstShortcut "$oldDesktopLink"
    Delete "$oldDesktopLink"
  ${EndIf}
!macroend
