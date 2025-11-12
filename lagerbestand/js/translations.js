/* ===========================
   TRANSLATIONS
   =========================== */

const translations = {
    de: {
        // Header
        appTitle: 'Lagerbestandswarnsystem',
        appSubtitle: 'Überwachen Sie Lagerbestände und erhalten Sie Warnungen bei Kapazitätsproblemen',
        
        // Tabs
        tabCheckStock: 'Bestand prüfen',
        tabManageMaterials: 'Materialien verwalten',
        tabArchive: 'Berichtsarchiv',
        tabSettings: 'Einstellungen',
        tabDashboard: 'Dashboard',
        
        // Dashboard
        dashboardTitle: 'Dashboard',
        dashboardSubtitle: 'Passen Sie Ihr Dashboard mit Drag-and-Drop-Widgets an',
        addWidgetBtn: 'Widget hinzufügen',
        resetLayoutBtn: 'Layout zurücksetzen',
        saveLayoutBtn: 'Layout speichern',
        selectWidgetTitle: 'Widget zum Hinzufügen auswählen',
        emptyDashboardTitle: 'Ihr Dashboard ist leer',
        emptyDashboardMessage: 'Fügen Sie Widgets hinzu, um mit Ihrem benutzerdefinierten Dashboard zu beginnen',
        addFirstWidgetBtn: 'Erstes Widget hinzufügen',
        confirmResetDashboard: 'Möchten Sie das Dashboard-Layout wirklich zurücksetzen? Dadurch werden alle Widgets entfernt und das Standard-Layout wiederhergestellt.',
        
        // Widget Titles
        'alerts-countTitle': 'Warnungen gesamt',
        'materials-countTitle': 'Materialien gesamt',
        'capacity-overviewTitle': 'Kapazitätsübersicht',
        'recent-alertsTitle': 'Aktuelle Warnungen',
        'storage-distributionTitle': 'Lagerverteilung',
        'capacity-trendsTitle': 'Kapazitätstrends',
        'top-materialsTitle': 'Top-Materialien nach Warnungen',
        'analytics-summaryTitle': 'Analyse-Zusammenfassung',
        
        // Widget Labels
        totalAlerts: 'Warnungen gesamt',
        totalMaterials: 'Materialien gesamt',
        utilized: 'Genutzt',
        currentStock: 'Aktueller Bestand',
        maxCapacity: 'Maximalkapazität',
        alerts: 'Warnungen',
        totalReports: 'Berichte gesamt',
        avgAlerts: 'Durchschn. Warnungen',
        units: 'Einheiten',
        utilizationPercent: 'Auslastung %',
        overCapacity: 'Über Kapazität',
        
        // Enhanced Archive Features
        archiveFilterTitle: 'Filter-Optionen',
        dateRangeFilter: 'Datumsbereich',
        alertCountFilter: 'Anzahl Warnungen',
        materialCountFilter: 'Anzahl Materialien',
        fromDate: 'Von Datum',
        toDate: 'Bis Datum',
        minAlerts: 'Min. Warnungen',
        maxAlerts: 'Max. Warnungen',
        minMaterials: 'Min. Materialien',
        maxMaterials: 'Max. Materialien',
        btnCompareReports: 'Berichte vergleichen',
        btnSelectForComparison: 'Zum Vergleich auswählen',
        btnClearSelection: 'Auswahl löschen',
        reportsSelected: 'Berichte ausgewählt',
        compareTitle: 'Berichtsvergleich',
        reportA: 'Bericht A',
        reportB: 'Bericht B',
        differences: 'Unterschiede',
        alertChanges: 'Warnungsänderungen',
        stockChanges: 'Bestandsänderungen',
        newMaterials: 'Neue Materialien',
        removedMaterials: 'Entfernte Materialien',
        
        // Custom Alert Rules
        alertRulesTitle: 'Benutzerdefinierte Warnregeln',
        storageTypesTitle: 'Lagertyp-Überwachung',
        timeBasedRulesTitle: 'Zeitbasierte Regeln',
        
        // Upload Section
        uploadTitle: 'LX02-Bericht hochladen',
        uploadFileTitle: 'Excel-Datei hochladen',
        uploadFileDragDrop: 'Ziehen Sie Ihre XLSX-Datei hierher',
        uploadFileOr: 'oder',
        uploadFileBrowse: 'Dateien durchsuchen',
        uploadFileHint: 'Unterstützt: .xlsx, .xls Dateien',
        uploadPasteTitle: 'Daten einfügen',
        uploadPasteDesc: 'Aus Excel kopieren und hier einfügen',
        uploadPasteLabel: 'LX02-Export einfügen (durch Tabulatoren oder mehrere Leerzeichen getrennt):',
        uploadPastePlaceholder: 'Material    Beschreibung    Lagertyp    Menge...',
        btnCheckStock: 'Bestand prüfen',
        btnClear: 'Löschen',
        
        // Stats
        statTotalMaterials: 'Materialien gesamt',
        statAlerts: 'Warnungen gefunden',
        statLocations: 'Lagerorte',
        
        // Results Table
        resultsTitle: 'Ergebnisse',
        resultsEmpty: 'Noch keine Daten analysiert. Laden Sie einen Bericht hoch, um Ergebnisse zu sehen.',
        colMaterial: 'Material',
        colStorageType: 'Lagertyp',
        colQuantity: 'Menge',
        colMKTCapacity: 'MKT-Kapazität',
        colAlerts: 'Warnungen',
        colActions: 'Aktionen',
        filterResults: 'Ergebnisse filtern',
        showAll: 'Alle anzeigen',
        showAlertsOnly: 'Nur Warnungen',
        filterPlaceholder: 'Filter...',
        
        // Materials Management
        addMaterialTitle: 'Neues Material hinzufügen',
        materialCode: 'Materialnummer',
        materialCodePlaceholder: 'z.B. 266920',
        materialName: 'Materialname',
        materialNamePlaceholder: 'z.B. Produkt XYZ',
        materialNameOptional: 'Optional',
        mktCapacity: 'MKT Maximalkapazität',
        mktCapacityPlaceholder: 'z.B. 10',
        mktCapacityHelp: 'Warnung wird ausgelöst, wenn die MKT-Menge diesen Wert überschreitet',
        jumpThreshold: 'Sprungschwelle',
        jumpThresholdPlaceholder: 'Standard: 5',
        jumpThresholdOptional: 'Optional - Warnung bei täglichem Anstieg über diesem Betrag',
        btnAddMaterial: 'Material hinzufügen',
        
        // Recently Added Materials
        recentlyAddedTitle: 'Kürzlich hinzugefügte Materialien',
        btnClearList: 'Liste löschen',
        recentlyAddedDescription: 'In dieser Sitzung hinzugefügte Materialien. Überprüfen Sie die Genauigkeit, bevor Sie fortfahren.',
        addedTimeAgo: 'Hinzugefügt',
        secondsAgo: '{seconds} Sekunden her',
        noRecentlyAddedMaterials: 'Keine Materialien in der Liste',
        recentlyAddedCleared: '{count} Materialien aus der Liste entfernt',
        btnRemove: 'Aus Liste entfernen',
        
        // Promotional Settings
        promoTitle: 'Aktionseinstellungen',
        promoCapacity: 'Aktionskapazität',
        promoCapacityPlaceholder: 'z.B. 20',
        promoCapacityHelp: 'Höheres Kapazitätslimit während Aktionen (leer lassen, falls nicht benötigt)',
        promoActive: 'Aktion aktuell aktiv',
        promoActiveHelp: 'Wenn aktiv, prüft das System gegen Aktionskapazität statt normaler Kapazität',
        promoEndDate: 'Aktionsende (Optional)',
        promoEndDateHelp: 'Aktion wird nach diesem Datum automatisch deaktiviert',
        
        // Materials List
        materialsListTitle: 'Konfigurierte Materialien',
        btnClearAllMaterials: 'Alle Materialien löschen',
        materialsEmpty: 'Noch keine Materialien konfiguriert.',
        colMaterialCode: 'Materialnummer',
        colMaterialName: 'Materialname',
        colMKTCapacity: 'MKT-Kapazität',
        colJumpThreshold: 'Sprungschwelle',
        colPromoStatus: 'Aktionsstatus',
        colCreated: 'Erstellt',
        btnEdit: 'Bearbeiten',
        btnDelete: 'Löschen',
        
        // Bulk Operations
        selectAll: 'Alle auswählen',
        itemsSelected: 'Materialien ausgewählt',
        btnBulkEdit: 'Bulk bearbeiten',
        btnBulkDelete: 'Bulk löschen',
        btnClearSelection: 'Auswahl aufheben',
        bulkEditTitle: 'Bulk Material bearbeiten',
        bulkEditDescription: '{count} Materialien werden aktualisiert. Wählen Sie die Felder zum Aktualisieren:',
        updateCapacity: 'Kapazität aktualisieren',
        updatePromoCapacity: 'Aktionskapazität aktualisieren',
        updateGroup: 'Gruppe aktualisieren',
        newCapacity: 'Neue Kapazität',
        newPromoCapacity: 'Neue Aktionskapazität',
        setPromoActive: 'Aktion als aktiv setzen',
        btnApplyChanges: 'Änderungen übernehmen',
        bulkDeleteConfirm: 'Sind Sie sicher, dass Sie {count} Materialien löschen möchten?',
        bulkDeleteWarning: 'Diese Aktion kann nicht rückgängig gemacht werden!',
        btnExportFiltered: 'Gefilterte exportieren',
        exportFilteredDesc: 'Nur aktuell sichtbare/gefilterte Materialien exportieren',
        multipleFilesSupported: 'Mehrere Dateien werden unterstützt',
        batchProcessingTitle: 'Batch-Verarbeitung',
        filesProcessed: 'Dateien verarbeitet',
        preparingFiles: 'Dateien vorbereiten...',
        processing: 'Verarbeiten',
        batchReportAggregated: 'Batch-Bericht (Aggregiert)',
        
        // Archive
        archiveTitle: 'Berichtsarchiv',
        btnClearAllArchive: 'Gesamtes Archiv löschen',
        archiveDescription: 'Zuvor hochgeladene Berichte werden automatisch zur Referenz gespeichert.',
        archiveEmpty: 'Noch keine archivierten Berichte.',
        colDateTime: 'Datum & Uhrzeit',
        colTotalMaterials: 'Materialien gesamt',
        colAlertsFound: 'Warnungen gefunden',
        colStorageLocations: 'Lagerorte',
        btnView: 'Anzeigen',
        
        // Backup & Export
        backupTitle: 'Datensicherung',
        backupDescription: 'Sichern Sie Ihre Materialien und Archivdaten',
        btnExportData: 'Daten exportieren',
        btnImportData: 'Daten importieren',
        backupExportDesc: 'Alle Materialien und Berichte als JSON-Datei herunterladen',
        backupImportDesc: 'Daten aus einer vorherigen Sicherung wiederherstellen',
        backupSuccess: 'Daten erfolgreich importiert',
        backupError: 'Fehler beim Importieren der Daten',
        backupImported: 'Importiert: {{materials}} Materialien, {{archive}} Berichte',
        
        // IndexedDB Sync
        syncTitle: 'Automatische Synchronisation',
        syncDescription: 'Ihre Daten werden automatisch in IndexedDB gesichert',
        syncStatusActive: 'Aktiv',
        syncStatusInactive: 'Nicht verfügbar',
        syncLastMaterials: 'Letzte Material-Sync',
        syncLastArchive: 'Letzte Archiv-Sync',
        btnRestoreFromIndexedDB: 'Von IndexedDB wiederherstellen',
        restoreDescription: 'Daten aus IndexedDB in localStorage wiederherstellen',
        restoreSuccess: 'Wiederherstellung erfolgreich',
        restoreError: 'Fehler bei Wiederherstellung',
        errorLoadingSyncStatus: 'Fehler beim Laden des Sync-Status',
        
        // Modal
        modalAddTitle: 'Neues Material hinzufügen',
        modalEditTitle: 'Material bearbeiten',
        modalQuickAddTitle: 'Material schnell hinzufügen',
        btnSave: 'Speichern',
        btnSaveChanges: 'Änderungen speichern',
        btnCancel: 'Abbrechen',
        
        // Toast Messages
        toastSuccess: 'Erfolg',
        toastError: 'Fehler',
        toastWarning: 'Warnung',
        toastInfo: 'Info',
        
        // Alert Messages
        alertOverCapacity: 'Über Kapazität',
        alertPromo: 'AKTION',
        promoActive: 'Aktiv',
        promoInactive: 'Inaktiv',
        
        // Buttons
        btnQuickAdd: 'Schnell hinzufügen',
        btnBrowse: 'Durchsuchen',
        btnAddMaterialModal: 'Material hinzufügen (Modal)',
        
        // DataTables
        dtSearch: 'Suchen:',
        dtLengthMenu: 'Zeige _MENU_ Einträge pro Seite',
        dtInfo: 'Zeige _START_ bis _END_ von _TOTAL_ Einträgen',
        dtInfoEmpty: 'Keine Einträge anzuzeigen',
        dtInfoFiltered: '(gefiltert von _MAX_ Einträgen gesamt)',
        dtZeroRecords: 'Keine passenden Einträge gefunden',
        dtFirst: 'Erste',
        dtLast: 'Letzte',
        dtNext: 'Weiter',
        dtPrevious: 'Zurück',
        
        // Materials Table Specific
        dtSearchMaterials: 'Materialien suchen:',
        dtLengthMenuMaterials: 'Zeige _MENU_ Materialien pro Seite',
        dtInfoMaterials: 'Zeige _START_ bis _END_ von _TOTAL_ Materialien',
        dtInfoEmptyMaterials: 'Keine Materialien anzuzeigen',
        dtInfoFilteredMaterials: '(gefiltert von _MAX_ Materialien gesamt)',
        dtZeroRecordsMaterials: 'Keine passenden Materialien gefunden',
        
        // Archive Table Specific
        dtSearchArchive: 'Archiv durchsuchen:',
        dtLengthMenuArchive: 'Zeige _MENU_ Berichte pro Seite',
        dtInfoArchive: 'Zeige _START_ bis _END_ von _TOTAL_ Berichten',
        dtInfoEmptyArchive: 'Keine Berichte anzuzeigen',
        dtInfoFilteredArchive: '(gefiltert von _MAX_ Berichten gesamt)',
        dtZeroRecordsArchive: 'Keine passenden Berichte gefunden',
        
        // Bulk Import/Export
        bulkImportTitle: 'Materialien-Import',
        bulkExportTitle: 'Materialien-Export',
        bulkImportExportDesc: 'Materialien in großen Mengen im CSV-Format importieren oder exportieren',
        btnImportMaterials: 'Materialien importieren',
        btnExportMaterials: 'Materialien exportieren',
        btnExportSAP: 'Für SAP exportieren',
        importMaterialsDesc: 'Materialien aus CSV/Excel-Datei importieren',
        exportMaterialsDesc: 'Materialien als CSV-Datei exportieren',
        exportSAPDesc: 'Materialnummern für SAP-Import exportieren (nur Materialnummern)',
        sapExportSuccess: 'Materialnummern für SAP exportiert',
        importSuccess: 'Materialien erfolgreich importiert',
        importError: 'Fehler beim Importieren der Materialien',
        exportSuccess: 'Materialien erfolgreich exportiert',
        csvHeaders: 'Material Code,Material Name,MKT Capacity,Jump Threshold,Promo Capacity,Promo Active,Promo End Date',

        // Advanced Filter
        filterTitle: 'Erweiterte Filter',
        filterMaterials: 'Materialien filtern',
        filterByCapacity: 'Nach Kapazität filtern',
        filterByThreshold: 'Nach Sprungschwelle filtern',
        filterByPromo: 'Nach Aktionsstatus filtern',
        filterPromoAll: 'Alle',
        filterPromoActive: 'Nur aktive Aktionen',
        filterPromoInactive: 'Nur inaktive Aktionen',
        filterPromoNone: 'Keine Aktionen',
        filterCapacityMin: 'Min. Kapazität',
        filterCapacityMax: 'Max. Kapazität',
        filterThresholdMin: 'Min. Schwelle',
        filterThresholdMax: 'Max. Schwelle',
        btnApplyFilter: 'Filter anwenden',
        btnClearFilter: 'Filter zurücksetzen',

        // Undo/Redo
        undoTitle: 'Aktionsverlauf',
        btnUndo: 'Rückgängig',
        btnRedo: 'Wiederholen',
        undoDisabled: 'Keine Aktionen verfügbar',
        redoDisabled: 'Keine wiederherstellbaren Aktionen',
        undoSuccess: 'Aktion erfolgreich rückgängig gemacht',
        redoSuccess: 'Aktion erfolgreich wiederholt',
        undoActionsAvailable: 'Aktionen',
        undoHistoryTitle: 'Letzte Aktionen',
        undoActionAdd: 'Material hinzugefügt',
        undoActionEdit: 'Material bearbeitet',
        undoActionDelete: 'Material gelöscht',
        undoActionBulkImport: 'Massen-Import',
        undoActionClearAll: 'Alle gelöscht',
        undoJustNow: 'Gerade eben',
        undoMinutesAgo: 'vor {{minutes}} Min.',
        undoHoursAgo: 'vor {{hours}} Std.',

        // Material Groups
        groupsTitle: 'Material-Gruppen',
        groupsDescription: 'Organisieren Sie Materialien in Gruppen für eine einfachere Verwaltung und Filterung.',
        groupTitle: 'Material-Gruppen',
        groupName: 'Gruppenname',
        materialGroup: 'Material-Gruppe',
        btnCreateGroup: 'Neue Gruppe erstellen',
        btnEditGroup: 'Gruppe bearbeiten',
        btnDeleteGroup: 'Gruppe löschen',
        groupAll: 'Alle Materialien',
        groupUngrouped: 'Nicht gruppiert',
        addToGroup: 'Zu Gruppe hinzufügen',
        enterGroupName: 'Geben Sie einen Gruppennamen ein',
        descriptionOptional: 'Beschreibung (optional)',
        enterGroupDescription: 'Geben Sie eine Gruppenbeschreibung ein',
        groupColor: 'Gruppenfarbe',
        viewMaterials: 'Materialien anzeigen',
        created: 'Erstellt',

        // User Notes
        notesTitle: 'Notizen',
        materialNotes: 'Material-Notizen',
        addNote: 'Notiz hinzufügen',
        editNote: 'Notiz bearbeiten',
        deleteNote: 'Notiz löschen',
        noteContent: 'Notizinhalt',
        notePlaceholder: 'Ihre Notiz hier eingeben...',

        // Enhanced Archive Features
        archiveFilterTitle: 'Filter-Optionen',
        dateRangeFilter: 'Datumsbereich',
        alertCountFilter: 'Anzahl Warnungen',
        materialCountFilter: 'Anzahl Materialien',
        fromDate: 'Von Datum',
        toDate: 'Bis Datum',
        minAlerts: 'Min. Warnungen',
        maxAlerts: 'Max. Warnungen',
        minMaterials: 'Min. Materialien',
        maxMaterials: 'Max. Materialien',
        btnCompareReports: 'Berichte vergleichen',
        btnSelectForComparison: 'Zum Vergleich auswählen',
        btnClearSelection: 'Auswahl löschen',
        reportsSelected: 'Berichte ausgewählt',
        compareTitle: 'Berichtsvergleich',
        reportA: 'Bericht A',
        reportB: 'Bericht B',
        differences: 'Unterschiede',
        alertChanges: 'Warnungsänderungen',
        stockChanges: 'Bestandsänderungen',
        newMaterials: 'Neue Materialien',
        removedMaterials: 'Entfernte Materialien',
        
        // Multi-Storage Type Support
        storageTypeSettings: 'Lagertyp-Einstellungen',
        monitoredStorageTypes: 'Überwachte Lagertypen',
        storageTypeDescription: 'Wählen Sie die Lagertypen aus, die auf Kapazitätswarnungen überwacht werden sollen',
        storageTypeMKT: 'MKT - Marktlager',
        storageTypeLAG: 'LAG - Lager',
        storageTypeQS: 'QS - Qualitätssicherung',
        storageTypeSPE: 'SPE - Sperrbestand',
        enabledStorageTypes: 'Aktivierte Lagertypen',
        defaultCapacityTitle: 'Standard-Kapazitäten pro Lagertyp',
        defaultCapacityDesc: 'Diese Werte werden verwendet, wenn kein materialspezifscher Wert definiert ist',
        
        // Data Backup/Restore
        backupRestoreTitle: 'Datensicherung & Wiederherstellung',
        backupDescription: 'Sichern Sie alle Ihre Daten (Materialien, Archiv, Gruppen, Notizen, Einstellungen) in einer JSON-Datei',
        restoreDescription: 'Stellen Sie Ihre Daten aus einer zuvor erstellten Sicherungsdatei wieder her',
        btnExportAllData: 'Alle Daten exportieren',
        btnImportAllData: 'Daten importieren',
        exportSuccess: 'Daten erfolgreich exportiert',
        importSuccess: 'Daten erfolgreich importiert',
        importError: 'Fehler beim Importieren der Daten',
        confirmRestore: 'Sind Sie sicher, dass Sie alle aktuellen Daten durch die importierten Daten ersetzen möchten? Diese Aktion kann nicht rückgängig gemacht werden.',
        invalidBackupFile: 'Ungültige Sicherungsdatei',
        backupInfo: 'Sicherungsinfo',
        backupDate: 'Sicherungsdatum',
        backupVersion: 'Version',
        dataTypes: 'Datentypen',
        
        // Custom Alert Rules
        alertRulesTitle: 'Benutzerdefinierte Warnregeln',
        storageTypesTitle: 'Lagertyp-Überwachung',
        timeBasedRulesTitle: 'Zeitbasierte Regeln',
        thresholdsTitle: 'Schwellenwerte',
        notificationsTitle: 'Benachrichtigungen',
        enabledLabel: 'Aktiviert',
        thresholdLabel: 'Schwellenwert (%)',
        weekendAlerts: 'Warnungen am Wochenende',
        businessHoursOnly: 'Nur Geschäftszeiten (8-18 Uhr)',
        capacityWarning: 'Kapazitätswarnung (%)',
        capacityCritical: 'Kritische Kapazität (%)',
        jumpAlert: 'Sprungwarnung',
        consecutiveAlerts: 'Aufeinanderfolgende Warnungen',
        enableSound: 'Ton aktivieren',
        enableBrowser: 'Browser-Benachrichtigungen',
        btnSaveRules: 'Regeln speichern',
        btnResetRules: 'Zurücksetzen',
        rulesUpdated: 'Warnregeln aktualisiert',

        // Misc
        required: '*',
        optional: '(optional)',
        normal: 'Normal',
        total: 'Total',
        units: 'Einheiten',
        locations: 'Standorte',
        location: 'Standort',
        updated: 'Aktualisiert',
        defaultThreshold: 'Standard (5)',
        noDataToDisplay: 'Keine Daten anzuzeigen',
        enterGroupName: 'Gruppennamen eingeben',
        descriptionOptional: 'Beschreibung (optional)',
        enterGroupDescription: 'Gruppenbeschreibung eingeben',
        associatedMaterialOptional: 'Zugeordnetes Material (optional)',
        generalNote: 'Allgemeine Notiz',
        helpsIdentifyMaterial: 'hilft bei der Identifizierung des Materials',
        created: 'Erstellt',
        updatedLabel: 'Aktualisiert',
        
        // New Features - Keyboard Shortcuts
        keyboardShortcuts: 'Tastaturkürzel',
        shortcutCheckStock: 'Zum Bestandsprüfung wechseln',
        shortcutMaterials: 'Zu Materialien wechseln',
        shortcutArchive: 'Zum Archiv wechseln',
        shortcutNewMaterial: 'Neues Material hinzufügen',
        shortcutSave: 'Formular speichern',
        shortcutSearch: 'Suche fokussieren',
        shortcutExport: 'Daten exportieren',
        shortcutImport: 'Daten importieren',
        shortcutClear: 'Ergebnisse löschen',
        shortcutDarkMode: 'Dunkelmodus umschalten',
        shortcutHighContrast: 'Hoher Kontrast umschalten',
        shortcutUndo: 'Rückgängig',
        shortcutRedo: 'Wiederholen',
        shortcutClose: 'Modal schließen',
        shortcutHelp: 'Tastaturkürzel anzeigen',
        
        // Notes & Tags
        materialNotes: 'Material-Notizen',
        materialTags: 'Material-Tags',
        addNote: 'Notiz hinzufügen',
        addTag: 'Tag hinzufügen',
        notePlaceholder: 'Notiz eingeben...',
        tagPlaceholder: 'Tag-Name eingeben...',
        notesTitle: 'Notizen',
        tagsTitle: 'Tags',
        noNotes: 'Noch keine Notizen',
        noTags: 'Noch keine Tags',
        noNotesYet: 'Noch keine Notizen hinzugefügt. Erstellen Sie Ihre erste Notiz, um wichtige Informationen zu verfolgen.',
        notesDescription: 'Fügen Sie persönliche Notizen und Kommentare für Materialien und Berichte hinzu.',
        
        // Confirmation Dialogs
        confirmDelete: 'Sind Sie sicher, dass Sie dies löschen möchten?',
        confirmClearAll: 'Sind Sie sicher, dass Sie alle Daten löschen möchten?',
        confirmAction: 'Aktion bestätigen',
        
        // Delete Modal
        deleteModalTitle: 'Löschen bestätigen',
        deleteModalMessage: 'Sind Sie sicher, dass Sie dies löschen möchten?',
        deleteModalConfirm: 'Löschen',
        deleteModalCancel: 'Abbrechen',
        deleteMaterialMessage: 'Möchten Sie das Material <strong>{code}</strong> wirklich löschen?',
        deleteNoteMessage: 'Möchten Sie diese Notiz wirklich löschen?',
        deleteArchiveMessage: 'Möchten Sie diesen archivierten Bericht wirklich löschen?',
        deleteWarning: 'Diese Aktion kann nicht rückgängig gemacht werden.',
        
        // Clear All Confirmation Modal
        clearAllModalTitle: 'WARNUNG: Alle Daten löschen',
        clearAllMaterialsMessage: 'Dies wird ALLE <strong>{count}</strong> konfigurierten Materialien dauerhaft löschen!',
        clearAllArchiveMessage: 'Dies wird ALLE <strong>{count}</strong> archivierten Berichte dauerhaft löschen!',
        clearAllWarning: 'Diese Aktion kann NICHT rückgängig gemacht werden.',
        clearAllInstruction: 'Geben Sie "DELETE" ein, um zu bestätigen:',
        clearAllPlaceholder: 'DELETE eingeben...',
        clearAllTypeMismatch: 'Bitte geben Sie "DELETE" exakt ein, um fortzufahren.',
        clearAllCancelled: 'Löschung abgebrochen. Ihre Daten sind sicher.',
        
        // Restore from IndexedDB
        restoreFromIndexedDBMessage: 'Dies wird Daten aus IndexedDB in localStorage wiederherstellen. <strong>Aktuelle localStorage-Daten werden ersetzt.</strong>',
        restoreFromIndexedDBWarning: 'Fortfahren?',
        
        // Delete Group
        deleteGroupMessage: 'Möchten Sie die Gruppe <strong>"{name}"</strong> wirklich löschen?',
        deleteGroupWithMaterialsMessage: 'Möchten Sie die Gruppe <strong>"{name}"</strong> löschen? Dies entfernt die Gruppe von <strong>{count}</strong> Material(ien), aber die Materialien selbst werden nicht gelöscht.',
        
        // Progress Indicators
        uploading: 'Wird hochgeladen...',
        processing: 'Wird verarbeitet...',
        saving: 'Wird gespeichert...',
        loading: 'Lädt...',
        
        // Accessibility
        skipToContent: 'Zum Hauptinhalt springen',
        skipToNavigation: 'Zur Navigation springen',
        highContrastEnabled: 'Hochkontrastmodus aktiviert',
        highContrastDisabled: 'Hochkontrastmodus deaktiviert',
        darkModeEnabled: 'Dunkelmodus aktiviert',
        darkModeDisabled: 'Dunkelmodus deaktiviert',
        
        // Auto-save
        autoSaving: 'Automatisches Speichern...',
        autoSaved: 'Automatisch gespeichert',
        autoSaveFailed: 'Automatisches Speichern fehlgeschlagen',
        
        // Bulk Operations
        bulkActions: 'Massenaktionen',
        selectAll: 'Alle auswählen',
        deselectAll: 'Alle abwählen',
        deleteSelected: 'Ausgewählte löschen',
        exportSelected: 'Ausgewählte exportieren',
        itemsSelected: 'Elemente ausgewählt',
        
        // Theme buttons
        toggleDarkMode: 'Dunkelmodus umschalten',
        toggleHighContrast: 'Hohen Kontrast umschalten',
        showKeyboardShortcuts: 'Tastaturkürzel anzeigen',
        
        // Validation Error Messages
        errorMaterialCodeRequired: 'Materialnummer ist erforderlich',
        errorMaterialCodeEmpty: 'Materialnummer darf nicht leer sein',
        errorMaterialCodeTooLong: 'Materialnummer zu lang (max. 50 Zeichen)',
        errorMaterialCodeInvalidChars: 'Materialnummer darf nur Buchstaben, Zahlen, Bindestriche und Unterstriche enthalten',
        errorCapacityRequired: 'Kapazität ist erforderlich',
        errorCapacityInvalidNumber: 'Kapazität muss eine gültige Zahl sein',
        errorCapacityNegative: 'Kapazität darf nicht negativ sein',
        errorCapacityTooLarge: 'Kapazität zu groß (max. 999.999)',
        errorCapacityNotInteger: 'Kapazität muss eine ganze Zahl sein',
        errorInvalidDateFormat: 'Ungültiges Datumsformat',
        errorDateOutOfRange: 'Datum muss innerhalb von ±10 Jahren liegen',
        errorEmailRequired: 'E-Mail ist erforderlich',
        errorEmailInvalidFormat: 'Ungültiges E-Mail-Format',
        errorFileTooLarge: 'Datei zu groß',
        errorUnsupportedFileType: 'Nicht unterstützter Dateityp',
        errorFileReadError: 'Fehler beim Lesen der Datei',
        errorInvalidJsonFile: 'Ungültige JSON-Datei',
        errorStorageQuotaExceeded: 'Speicherplatz überschritten. Bitte löschen Sie alte Daten.',
        errorStorageGeneric: 'Speicherfehler',
        
        // File Validation Messages
        fileValidExcelXlsx: 'Gültige Excel-Datei (XLSX)',
        fileValidExcelXls: 'Gültige Excel-Datei (XLS)',
        fileValidJson: 'Gültige JSON-Datei',
        fileValidCsv: 'Gültige CSV-Datei',
        fileInvalidType: 'Nicht unterstützter Dateityp',
        
        // Success Messages
        successMaterialCodeValid: 'Gültige Materialnummer',
        successCapacityValid: 'Gültige Kapazität',
        successDateValid: 'Gültiges Datum',
        successEmailValid: 'Gültige E-Mail',
        successLengthValid: 'Gültige Länge',
        successFileStored: 'Erfolgreich gespeichert',
        
        // Storage Management
        storageManagementTitle: 'Speicherverwaltung',
        storageManagementDesc: 'Überwachen und optimieren Sie die Browser-Speichernutzung für archivierte Berichte.',
        archiveEntries: 'Archiveinträge',
        estimatedSize: 'Geschätzte Größe',
        oldestEntry: 'Ältester Eintrag',
        btnCleanupOld: 'Alte bereinigen',
        btnOptimizeStorage: 'Speicher optimieren',
        btnRefresh: 'Aktualisieren',
        cleanupOldTitle: 'Alte Archiveinträge bereinigen',
        cleanupOldConfirm: 'Dadurch werden Archiveinträge entfernt, die älter als 30 Tage sind. Fortfahren?',
        optimizeTitle: 'Speicher optimieren',
        optimizeConfirm: 'Dies führt eine aggressive Bereinigung durch, wenn der Speicher 20 MB überschreitet. Fortfahren?',
        cleanupSuccess: 'Bereinigung erfolgreich abgeschlossen',
        optimizeSuccess: 'Speicher erfolgreich optimiert',
        storageCleanupError: 'Fehler bei der Speicherbereinigung',
        noArchiveData: 'Keine Archivdaten',
        neverEntry: 'Nie'
    },
    en: {
        // Header
        appTitle: 'Warehouse Warning System',
        appSubtitle: 'Monitor inventory levels and receive alerts for capacity issues',
        
        // Tabs
        tabCheckStock: 'Check Stock',
        tabManageMaterials: 'Manage Materials',
        tabArchive: 'Report Archive',
        tabSettings: 'Settings',
        tabDashboard: 'Dashboard',
        
        // Dashboard
        dashboardTitle: 'Dashboard',
        dashboardSubtitle: 'Customize your dashboard with drag-and-drop widgets',
        addWidgetBtn: 'Add Widget',
        resetLayoutBtn: 'Reset Layout',
        saveLayoutBtn: 'Save Layout',
        selectWidgetTitle: 'Select Widget to Add',
        emptyDashboardTitle: 'Your Dashboard is Empty',
        emptyDashboardMessage: 'Add widgets to get started with your custom dashboard',
        addFirstWidgetBtn: 'Add Your First Widget',
        confirmResetDashboard: 'Are you sure you want to reset the dashboard layout? This will remove all widgets and restore the default layout.',
        
        // Widget Titles
        'alerts-countTitle': 'Total Alerts',
        'materials-countTitle': 'Total Materials',
        'capacity-overviewTitle': 'Capacity Overview',
        'recent-alertsTitle': 'Recent Alerts',
        'storage-distributionTitle': 'Storage Distribution',
        'capacity-trendsTitle': 'Capacity Trends',
        'top-materialsTitle': 'Top Materials by Alerts',
        'analytics-summaryTitle': 'Analytics Summary',
        
        // Widget Labels
        totalAlerts: 'Total Alerts',
        totalMaterials: 'Total Materials',
        utilized: 'Utilized',
        currentStock: 'Current Stock',
        maxCapacity: 'Max Capacity',
        alerts: 'alerts',
        totalReports: 'Total Reports',
        avgAlerts: 'Avg Alerts',
        units: 'Units',
        utilizationPercent: 'Utilization %',
        overCapacity: 'Over Capacity',
        
        // Upload Section
        uploadTitle: 'Upload LX02 Report',
        uploadFileTitle: 'Upload Excel File',
        uploadFileDragDrop: 'Drag & drop your XLSX file here',
        uploadFileOr: 'or',
        uploadFileBrowse: 'Browse Files',
        uploadFileHint: 'Supported: .xlsx, .xls files',
        uploadPasteTitle: 'Paste Data',
        uploadPasteDesc: 'Copy from Excel and paste here',
        uploadPasteLabel: 'Paste your LX02 export (tab or multiple spaces separated):',
        uploadPastePlaceholder: 'Material    Description    Storage Type    Quantity...',
        btnCheckStock: 'Check Stock',
        btnClear: 'Clear',
        
        // Stats
        statTotalMaterials: 'Total Materials',
        statAlerts: 'Alerts Found',
        statLocations: 'Storage Locations',
        
        // Results Table
        resultsTitle: 'Results',
        resultsEmpty: 'No data analyzed yet. Upload a report to see results.',
        colMaterial: 'Material',
        colStorageType: 'Storage Type',
        colQuantity: 'Quantity',
        colMKTCapacity: 'MKT Capacity',
        colAlerts: 'Alerts',
        colActions: 'Actions',
        filterResults: 'Filter Results',
        showAll: 'Show All',
        showAlertsOnly: 'Alerts Only',
        filterPlaceholder: 'Filter...',
        
        // Materials Management
        addMaterialTitle: 'Add New Material',
        materialCode: 'Material Code',
        materialCodePlaceholder: 'e.g., 266920',
        materialName: 'Material Name',
        materialNamePlaceholder: 'e.g., Product XYZ',
        materialNameOptional: 'Optional',
        mktCapacity: 'MKT Maximum Capacity',
        mktCapacityPlaceholder: 'e.g., 10',
        mktCapacityHelp: 'Alert will trigger when MKT quantity exceeds this value',
        jumpThreshold: 'Jump Threshold',
        jumpThresholdPlaceholder: 'Default: 5',
        jumpThresholdOptional: 'Optional - alert when daily increase exceeds this amount',
        btnAddMaterial: 'Add Material',
        
        // Recently Added Materials
        recentlyAddedTitle: 'Recently Added Materials',
        btnClearList: 'Clear List',
        recentlyAddedDescription: 'Materials added in this session. Review for accuracy before continuing.',
        addedTimeAgo: 'Added',
        secondsAgo: '{seconds} seconds ago',
        noRecentlyAddedMaterials: 'No materials in the list',
        recentlyAddedCleared: 'Cleared {count} materials from the list',
        btnRemove: 'Remove from list',
        
        // Promotional Settings
        promoTitle: 'Promotional Settings',
        promoCapacity: 'Promotional Capacity',
        promoCapacityPlaceholder: 'e.g., 20',
        promoCapacityHelp: 'Higher capacity limit during promotions (leave empty if not needed)',
        promoActive: 'Promotion Currently Active',
        promoActiveHelp: 'When active, the system will check against promotional capacity instead of normal capacity',
        promoEndDate: 'Promotion End Date (Optional)',
        promoEndDateHelp: 'Promotion will automatically deactivate after this date',
        
        // Materials List
        materialsListTitle: 'Configured Materials',
        btnClearAllMaterials: 'Clear All Materials',
        materialsEmpty: 'No materials configured yet.',
        colMaterialCode: 'Material Code',
        colMaterialName: 'Material Name',
        colMKTCapacity: 'MKT Capacity',
        colJumpThreshold: 'Jump Threshold',
        colPromoStatus: 'Promo Status',
        colCreated: 'Created',
        btnEdit: 'Edit',
        btnDelete: 'Delete',
        
        // Bulk Operations
        selectAll: 'Select All',
        itemsSelected: 'materials selected',
        btnBulkEdit: 'Bulk Edit',
        btnBulkDelete: 'Bulk Delete',
        btnClearSelection: 'Clear Selection',
        bulkEditTitle: 'Bulk Edit Materials',
        bulkEditDescription: '{count} materials will be updated. Select fields to update:',
        updateCapacity: 'Update Capacity',
        updatePromoCapacity: 'Update Promo Capacity',
        updateGroup: 'Update Group',
        newCapacity: 'New Capacity',
        newPromoCapacity: 'New Promo Capacity',
        setPromoActive: 'Set Promo Active',
        btnApplyChanges: 'Apply Changes',
        bulkDeleteConfirm: 'Are you sure you want to delete {count} materials?',
        bulkDeleteWarning: 'This action cannot be undone!',
        btnExportFiltered: 'Export Filtered',
        exportFilteredDesc: 'Export only currently visible/filtered materials',
        multipleFilesSupported: 'Multiple files supported',
        batchProcessingTitle: 'Batch Processing',
        filesProcessed: 'files processed',
        preparingFiles: 'Preparing files...',
        processing: 'Processing',
        batchReportAggregated: 'Batch Report (Aggregated)',
        
        // Archive
        archiveTitle: 'Report Archive',
        btnClearAllArchive: 'Clear All Archive',
        archiveDescription: 'Previously uploaded reports are automatically saved for your reference.',
        archiveEmpty: 'No archived reports yet.',
        colDateTime: 'Date & Time',
        colTotalMaterials: 'Total Materials',
        colAlertsFound: 'Alerts Found',
        colStorageLocations: 'Storage Locations',
        btnView: 'View',
        
        // Backup & Export
        backupTitle: 'Data Backup',
        backupDescription: 'Backup your materials and archive data',
        btnExportData: 'Export Data',
        btnImportData: 'Import Data',
        backupExportDesc: 'Download all materials and reports as JSON file',
        backupImportDesc: 'Restore data from a previous backup',
        backupSuccess: 'Data imported successfully',
        backupError: 'Error importing data',
        backupImported: 'Imported: {{materials}} materials, {{archive}} reports',
        
        // IndexedDB Sync
        syncTitle: 'Automatic Sync',
        syncDescription: 'Your data is automatically backed up to IndexedDB',
        syncStatusActive: 'Active',
        syncStatusInactive: 'Not Available',
        syncLastMaterials: 'Last materials sync',
        syncLastArchive: 'Last archive sync',
        btnRestoreFromIndexedDB: 'Restore from IndexedDB',
        restoreDescription: 'Restore data from IndexedDB to localStorage',
        restoreSuccess: 'Restoration successful',
        restoreError: 'Error during restoration',
        errorLoadingSyncStatus: 'Error loading sync status',
        
        // Modal
        modalAddTitle: 'Add New Material',
        modalEditTitle: 'Edit Material',
        modalQuickAddTitle: 'Quick Add Material',
        btnSave: 'Save Material',
        btnSaveChanges: 'Save Changes',
        btnCancel: 'Cancel',
        
        // Toast Messages
        toastSuccess: 'Success',
        toastError: 'Error',
        toastWarning: 'Warning',
        toastInfo: 'Info',
        
        // Alert Messages
        alertOverCapacity: 'Over capacity',
        alertPromo: 'PROMO',
        promoActive: 'Active',
        promoInactive: 'Inactive',
        
        // Buttons
        btnQuickAdd: 'Quick Add',
        btnBrowse: 'Browse',
        btnAddMaterialModal: 'Add Material (Modal)',
        
        // DataTables
        dtSearch: 'Search:',
        dtLengthMenu: 'Show _MENU_ entries per page',
        dtInfo: 'Showing _START_ to _END_ of _TOTAL_ entries',
        dtInfoEmpty: 'No entries to display',
        dtInfoFiltered: '(filtered from _MAX_ total entries)',
        dtZeroRecords: 'No matching entries found',
        dtFirst: 'First',
        dtLast: 'Last',
        dtNext: 'Next',
        dtPrevious: 'Previous',
        
        // Materials Table Specific
        dtSearchMaterials: 'Search materials:',
        dtLengthMenuMaterials: 'Show _MENU_ materials per page',
        dtInfoMaterials: 'Showing _START_ to _END_ of _TOTAL_ materials',
        dtInfoEmptyMaterials: 'No materials to display',
        dtInfoFilteredMaterials: '(filtered from _MAX_ total materials)',
        dtZeroRecordsMaterials: 'No matching materials found',
        
        // Archive Table Specific
        dtSearchArchive: 'Search archive:',
        dtLengthMenuArchive: 'Show _MENU_ reports per page',
        dtInfoArchive: 'Showing _START_ to _END_ of _TOTAL_ reports',
        dtInfoEmptyArchive: 'No reports to display',
        dtInfoFilteredArchive: '(filtered from _MAX_ total reports)',
        dtZeroRecordsArchive: 'No matching reports found',
        
        // Bulk Import/Export
        bulkImportTitle: 'Bulk Import Materials',
        bulkExportTitle: 'Bulk Export Materials',
        bulkImportExportDesc: 'Import or export materials in bulk using CSV format',
        btnImportMaterials: 'Import Materials',
        btnExportMaterials: 'Export Materials',
        btnExportSAP: 'Export for SAP',
        importMaterialsDesc: 'Import materials from CSV/Excel file',
        exportMaterialsDesc: 'Export materials as CSV file',
        exportSAPDesc: 'Export material numbers for SAP import (material numbers only)',
        sapExportSuccess: 'material numbers exported for SAP',
        importSuccess: 'Materials imported successfully',
        importError: 'Error importing materials',
        exportSuccess: 'Materials exported successfully',
        csvHeaders: 'Material Code,Material Name,MKT Capacity,Jump Threshold,Promo Capacity,Promo Active,Promo End Date',

        // Advanced Filter
        filterTitle: 'Advanced Filters',
        filterMaterials: 'Filter Materials',
        filterByCapacity: 'Filter by Capacity',
        filterByThreshold: 'Filter by Threshold',
        filterByPromo: 'Filter by Promotion Status',
        filterPromoAll: 'All',
        filterPromoActive: 'Active Promotions Only',
        filterPromoInactive: 'Inactive Promotions Only',
        filterPromoNone: 'No Promotions',
        filterCapacityMin: 'Min Capacity',
        filterCapacityMax: 'Max Capacity',
        filterThresholdMin: 'Min Threshold',
        filterThresholdMax: 'Max Threshold',
        btnApplyFilter: 'Apply Filter',
        btnClearFilter: 'Clear Filter',

        // Undo/Redo
        undoTitle: 'Action History',
        btnUndo: 'Undo',
        btnRedo: 'Redo',
        undoDisabled: 'No actions available',
        redoDisabled: 'No actions to restore',
        undoSuccess: 'Action undone successfully',
        redoSuccess: 'Action redone successfully',
        undoActionsAvailable: 'actions',
        undoHistoryTitle: 'Recent Actions',
        undoActionAdd: 'Material added',
        undoActionEdit: 'Material edited',
        undoActionDelete: 'Material deleted',
        undoActionBulkImport: 'Bulk import',
        undoActionClearAll: 'All cleared',
        undoJustNow: 'Just now',
        undoMinutesAgo: '{{minutes}} min ago',
        undoHoursAgo: '{{hours}} hrs ago',

        // Material Groups
        groupsTitle: 'Material Groups',
        groupsDescription: 'Organize materials into groups for easier management and filtering.',
        groupTitle: 'Material Groups',
        groupName: 'Group Name',
        materialGroup: 'Material Group',
        btnCreateGroup: 'Create New Group',
        btnEditGroup: 'Edit Group',
        btnDeleteGroup: 'Delete Group',
        groupAll: 'All Materials',
        groupUngrouped: 'Ungrouped',
        addToGroup: 'Add to Group',
        enterGroupName: 'Enter a group name',
        descriptionOptional: 'Description (optional)',
        enterGroupDescription: 'Enter a group description',
        groupColor: 'Group Color',
        viewMaterials: 'View Materials',
        created: 'Created',

        // User Notes
        notesTitle: 'Notes',
        materialNotes: 'Material Notes',
        addNote: 'Add Note',
        editNote: 'Edit Note',
        deleteNote: 'Delete Note',
        noteContent: 'Note Content',
        notePlaceholder: 'Enter your note here...',

        // Enhanced Archive Features
        archiveFilterTitle: 'Filter Options',
        dateRangeFilter: 'Date Range',
        alertCountFilter: 'Alert Count',
        materialCountFilter: 'Material Count',
        fromDate: 'From Date',
        toDate: 'To Date',
        minAlerts: 'Min Alerts',
        maxAlerts: 'Max Alerts',
        minMaterials: 'Min Materials',
        maxMaterials: 'Max Materials',
        btnCompareReports: 'Compare Reports',
        btnSelectForComparison: 'Select for Comparison',
        btnClearSelection: 'Clear Selection',
        reportsSelected: 'reports selected',
        compareTitle: 'Report Comparison',
        reportA: 'Report A',
        reportB: 'Report B',
        differences: 'Differences',
        alertChanges: 'Alert Changes',
        stockChanges: 'Stock Changes',
        newMaterials: 'New Materials',
        removedMaterials: 'Removed Materials',

        // Multi-Storage Type Support
        storageTypeSettings: 'Storage Type Settings',
        monitoredStorageTypes: 'Monitored Storage Types',
        storageTypeDescription: 'Select which storage types should be monitored for capacity alerts',
        storageTypeMKT: 'MKT - Market Storage',
        storageTypeLAG: 'LAG - Warehouse',
        storageTypeQS: 'QS - Quality Assurance',
        storageTypeSPE: 'SPE - Blocked Stock',
        enabledStorageTypes: 'Enabled Storage Types',
        defaultCapacityTitle: 'Default Capacities per Storage Type',
        defaultCapacityDesc: 'These values are used when no material-specific value is defined',

        // Data Backup/Restore
        backupRestoreTitle: 'Data Backup & Restore',
        backupDescription: 'Backup all your data (materials, archive, groups, notes, settings) to a JSON file',
        restoreDescription: 'Restore your data from a previously created backup file',
        btnExportAllData: 'Export All Data',
        btnImportAllData: 'Import Data',
        exportSuccess: 'Data exported successfully',
        importSuccess: 'Data imported successfully',
        importError: 'Error importing data',
        confirmRestore: 'Are you sure you want to replace all current data with the imported data? This action cannot be undone.',
        invalidBackupFile: 'Invalid backup file',
        backupInfo: 'Backup Info',
        backupDate: 'Backup Date',
        backupVersion: 'Version',
        dataTypes: 'Data Types',

        // Custom Alert Rules
        alertRulesTitle: 'Custom Alert Rules',
        storageTypesTitle: 'Storage Type Monitoring',
        timeBasedRulesTitle: 'Time-Based Rules',
        thresholdsTitle: 'Thresholds',
        notificationsTitle: 'Notifications',
        enabledLabel: 'Enabled',
        thresholdLabel: 'Threshold (%)',
        weekendAlerts: 'Weekend Alerts',
        businessHoursOnly: 'Business Hours Only (8-18h)',
        capacityWarning: 'Capacity Warning (%)',
        capacityCritical: 'Critical Capacity (%)',
        jumpAlert: 'Jump Alert',
        consecutiveAlerts: 'Consecutive Alerts',
        enableSound: 'Enable Sound',
        enableBrowser: 'Browser Notifications',
        btnSaveRules: 'Save Rules',
        btnResetRules: 'Reset to Default',
        rulesUpdated: 'Alert rules updated',

        // Misc
        required: '*',
        optional: '(optional)',
        normal: 'Normal',
        total: 'Total',
        units: 'units',
        locations: 'locations',
        location: 'location',
        updated: 'Updated',
        defaultThreshold: 'Default (5)',
        noDataToDisplay: 'No data to display',
        enterGroupName: 'Enter group name',
        descriptionOptional: 'Description (optional)',
        enterGroupDescription: 'Enter group description',
        associatedMaterialOptional: 'Associated Material (optional)',
        generalNote: 'General Note',
        helpsIdentifyMaterial: 'helps identify the material',
        created: 'Created',
        updatedLabel: 'Updated',
        
        // New Features - Keyboard Shortcuts
        keyboardShortcuts: 'Keyboard Shortcuts',
        shortcutCheckStock: 'Switch to Check Stock',
        shortcutMaterials: 'Switch to Materials',
        shortcutArchive: 'Switch to Archive',
        shortcutNewMaterial: 'Add New Material',
        shortcutSave: 'Save Form',
        shortcutSearch: 'Focus Search',
        shortcutExport: 'Export Data',
        shortcutImport: 'Import Data',
        shortcutClear: 'Clear Results',
        shortcutDarkMode: 'Toggle Dark Mode',
        shortcutHighContrast: 'Toggle High Contrast',
        shortcutUndo: 'Undo',
        shortcutRedo: 'Redo',
        shortcutClose: 'Close Modal',
        shortcutHelp: 'Show Shortcuts',
        
        // Notes & Tags
        materialNotes: 'Material Notes',
        materialTags: 'Material Tags',
        addNote: 'Add Note',
        addTag: 'Add Tag',
        notePlaceholder: 'Enter note...',
        tagPlaceholder: 'Enter tag name...',
        notesTitle: 'Notes',
        tagsTitle: 'Tags',
        noNotes: 'No notes yet',
        noTags: 'No tags yet',
        noNotesYet: 'No notes added yet. Create your first note to track important information.',
        notesDescription: 'Add personal notes and comments for materials and reports.',
        
        // Confirmation Dialogs
        confirmDelete: 'Are you sure you want to delete this?',
        confirmClearAll: 'Are you sure you want to clear all data?',
        confirmAction: 'Confirm Action',
        
        // Delete Modal
        deleteModalTitle: 'Confirm Deletion',
        deleteModalMessage: 'Are you sure you want to delete this?',
        deleteModalConfirm: 'Delete',
        deleteModalCancel: 'Cancel',
        deleteMaterialMessage: 'Are you sure you want to delete material <strong>{code}</strong>?',
        deleteNoteMessage: 'Are you sure you want to delete this note?',
        deleteArchiveMessage: 'Are you sure you want to delete this archived report?',
        deleteWarning: 'This action cannot be undone.',
        
        // Clear All Confirmation Modal
        clearAllModalTitle: 'WARNING: Clear All Data',
        clearAllMaterialsMessage: 'This will permanently delete ALL <strong>{count}</strong> configured material(s)!',
        clearAllArchiveMessage: 'This will permanently delete ALL <strong>{count}</strong> archived report(s)!',
        clearAllWarning: 'This action CANNOT be undone.',
        clearAllInstruction: 'Type "DELETE" to confirm:',
        clearAllPlaceholder: 'Type DELETE...',
        clearAllTypeMismatch: 'Please type "DELETE" exactly to proceed.',
        clearAllCancelled: 'Clear cancelled. Your data is safe.',
        
        // Restore from IndexedDB
        restoreFromIndexedDBMessage: 'This will restore data from IndexedDB to localStorage. <strong>Current localStorage data will be replaced.</strong>',
        restoreFromIndexedDBWarning: 'Continue?',
        
        // Delete Group
        deleteGroupMessage: 'Are you sure you want to delete group <strong>"{name}"</strong>?',
        deleteGroupWithMaterialsMessage: 'Delete group <strong>"{name}"</strong>? This will remove the group from <strong>{count}</strong> material(s), but the materials themselves will not be deleted.',
        
        // Progress Indicators
        uploading: 'Uploading...',
        processing: 'Processing...',
        saving: 'Saving...',
        loading: 'Loading...',
        
        // Accessibility
        skipToContent: 'Skip to main content',
        skipToNavigation: 'Skip to navigation',
        highContrastEnabled: 'High contrast mode enabled',
        highContrastDisabled: 'High contrast mode disabled',
        darkModeEnabled: 'Dark mode enabled',
        darkModeDisabled: 'Dark mode disabled',
        
        // Auto-save
        autoSaving: 'Auto-saving...',
        autoSaved: 'Auto-saved',
        autoSaveFailed: 'Auto-save failed',
        
        // Bulk Operations
        bulkActions: 'Bulk Actions',
        selectAll: 'Select All',
        deselectAll: 'Deselect All',
        deleteSelected: 'Delete Selected',
        exportSelected: 'Export Selected',
        itemsSelected: 'items selected',
        
        // Theme buttons
        toggleDarkMode: 'Toggle dark mode',
        toggleHighContrast: 'Toggle high contrast',
        showKeyboardShortcuts: 'Show keyboard shortcuts',
        
        // Validation Error Messages
        errorMaterialCodeRequired: 'Material code is required',
        errorMaterialCodeEmpty: 'Material code cannot be empty',
        errorMaterialCodeTooLong: 'Material code too long (max 50 characters)',
        errorMaterialCodeInvalidChars: 'Material code can only contain letters, numbers, hyphens, and underscores',
        errorCapacityRequired: 'Capacity is required',
        errorCapacityInvalidNumber: 'Capacity must be a valid number',
        errorCapacityNegative: 'Capacity cannot be negative',
        errorCapacityTooLarge: 'Capacity too large (max 999,999)',
        errorCapacityNotInteger: 'Capacity must be a whole number',
        errorInvalidDateFormat: 'Invalid date format',
        errorDateOutOfRange: 'Date must be within ±10 years',
        errorEmailRequired: 'Email is required',
        errorEmailInvalidFormat: 'Invalid email format',
        errorFileTooLarge: 'File too large',
        errorUnsupportedFileType: 'Unsupported file type',
        errorFileReadError: 'Error reading file',
        errorInvalidJsonFile: 'Invalid JSON file',
        errorStorageQuotaExceeded: 'Storage quota exceeded. Please clear old data.',
        errorStorageGeneric: 'Storage error',
        
        // File Validation Messages
        fileValidExcelXlsx: 'Valid Excel file (XLSX)',
        fileValidExcelXls: 'Valid Excel file (XLS)',
        fileValidJson: 'Valid JSON file',
        fileValidCsv: 'Valid CSV file',
        fileInvalidType: 'Unsupported file type',
        
        // Success Messages
        successMaterialCodeValid: 'Valid material code',
        successCapacityValid: 'Valid capacity',
        successDateValid: 'Valid date',
        successEmailValid: 'Valid email',
        successLengthValid: 'Valid length',
        successFileStored: 'Stored successfully',
        
        // Storage Management
        storageManagementTitle: 'Storage Management',
        storageManagementDesc: 'Monitor and optimize browser storage usage for archived reports.',
        archiveEntries: 'Archive Entries',
        estimatedSize: 'Estimated Size',
        oldestEntry: 'Oldest Entry',
        btnCleanupOld: 'Cleanup Old',
        btnOptimizeStorage: 'Optimize Storage',
        btnRefresh: 'Refresh',
        cleanupOldTitle: 'Cleanup Old Archive Entries',
        cleanupOldConfirm: 'This will remove archive entries older than 30 days. Continue?',
        optimizeTitle: 'Optimize Storage',
        optimizeConfirm: 'This will aggressively clean archive data if storage exceeds 20MB. Continue?',
        cleanupSuccess: 'Cleanup completed successfully',
        optimizeSuccess: 'Storage optimized successfully',
        storageCleanupError: 'Error during storage cleanup',
        noArchiveData: 'No archive data',
        neverEntry: 'Never'
    }
};

// Language Manager
class LanguageManager {
    constructor() {
        this.currentLanguage = this.loadLanguage();
    }

    loadLanguage() {
        try {
            const saved = localStorage.getItem('warehouse_language');
            return saved || 'de'; // Default to German
        } catch (e) {
            console.warn('Failed to load language from localStorage:', e);
            return 'de'; // Default to German
        }
    }

    saveLanguage(lang) {
        try {
            localStorage.setItem('warehouse_language', lang);
            this.currentLanguage = lang;
        } catch (e) {
            console.error('Failed to save language to localStorage:', e);
            this.currentLanguage = lang;
        }
    }

    setLanguage(lang) {
        if (translations[lang]) {
            this.saveLanguage(lang);
            this.currentLanguage = lang;
            return true;
        }
        return false;
    }

    t(key) {
        return translations[this.currentLanguage][key] || key;
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }
}
