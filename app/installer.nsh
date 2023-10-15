Caption "${PRODUCT_NAME} ${VERSION}"

Section "Pre-Install"
    IfFileExists "$INSTDIR\sales.db" DBFound DBNotFound
    DBFound:
        CopyFiles "$INSTDIR\sales.db" "$INSTDIR\..\sales.db"
    DBNotFound:
        Goto 0
SectionEnd

; Section "Post-Install" POST_INSTALL
;     ; copy 0.1.0 db files
;     ; IfFileExists "C:\Users\wanru\AppData\Local\sales\app-0.1.0\sales.db" DBFound DBNotFound
;     ; DBFound:
;     ;     CopyFiles "C:\Users\wanru\AppData\Local\sales\app-0.1.0\sales.db" "$INSTDIR\sales.db"
;     ; DBNotFound:
;     ;     Goto 0
    
;     ; copy > 0.2.0 db files
;     IfFileExists "$INSTDIR\..\sales.db" DBBackupFound DBBackupNotFound
;     DBBackupFound:
;         CopyFiles "$INSTDIR\..\sales.db" "$INSTDIR\sales.db"
;     DBBackupNotFound:
;         Goto 0
; SectionEnd

Function .onInstSuccess
    IfFileExists "$INSTDIR\..\sales.db" DBBackupFound DBBackupNotFound
    DBBackupFound:
        CopyFiles "$INSTDIR\..\sales.db" "$INSTDIR\sales.db"
    DBBackupNotFound:
        Goto 0
FunctionEnd

