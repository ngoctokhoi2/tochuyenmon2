/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  TeacherMember, 
  MonthlyReport, 
  StrugglingStudent, 
  TeamPlanDocument, 
  ExamAndLessonPlan, 
  LessonStudyTopic, 
  LessonStudyFeedback,
  SchoolDirective, 
  MeetingNotice,
  EmulationRecord,
  EmulationDocument,
  ClassTimetable,
  AppSettings
} from './types';
import { 
  INITIAL_MEMBERS, 
  INITIAL_MONTHLY_REPORTS, 
  INITIAL_STRUGGLING_STUDENTS, 
  INITIAL_TEAM_DOCUMENTS, 
  INITIAL_EXAMS_AND_PLANS, 
  INITIAL_LESSON_STUDIES, 
  INITIAL_DIRECTIVES, 
  INITIAL_MEETINGS,
  INITIAL_EMULATIONS, 
  INITIAL_TIMETABLES,
  INITIAL_APP_SETTINGS 
} from './data/initialData';

import { 
  loadPersistentData, 
  savePersistentData, 
  clearAllPersistentData,
  downloadBackupFile
} from './utils/persistentStorage';

import {
  getActiveUserEmail,
  setActiveUserEmail,
  isHostServerDevice,
  pushDataToOnlineServer,
  pullDataFromOnlineServer,
  deleteDataFromOnlineServer,
  checkServerSyncStatus,
  subscribeToOnlineUpdates,
  sendBeaconSync,
  getLastKnownRevision,
  setDeviceMode
} from './utils/onlineSync';

import { testFirestoreConnection } from './firebase/config';

import {
  subscribeToAllFirestoreData,
  saveReportToFirestore,
  deleteReportFromFirestore,
  saveStudentToFirestore,
  deleteStudentFromFirestore,
  saveTeamDocToFirestore,
  deleteTeamDocFromFirestore,
  saveExamToFirestore,
  deleteExamFromFirestore,
  saveLessonStudyToFirestore,
  deleteLessonStudyFromFirestore,
  saveDirectiveToFirestore,
  deleteDirectiveFromFirestore,
  saveMeetingToFirestore,
  deleteMeetingFromFirestore,
  saveEmulationToFirestore,
  deleteEmulationFromFirestore,
  saveEmulationDocToFirestore,
  deleteEmulationDocFromFirestore,
  saveTimetableToFirestore,
  deleteTimetableFromFirestore,
  saveMemberToFirestore,
  deleteMemberFromFirestore,
  saveSettingsToFirestore,
  saveFullStateToFirestore
} from './firebase/firestoreService';

import { Header } from './components/Header';
import { SyncMemorizeBar } from './components/SyncMemorizeBar';
import { Navigation, TabType } from './components/Navigation';
import { Home, Sparkles, RefreshCw } from 'lucide-react';
import { MonthlyReportView } from './components/MonthlyReportView';
import { StrugglingStudentsView } from './components/StrugglingStudentsView';
import { TeamDocumentsView } from './components/TeamDocumentsView';
import { ExamAndLessonPlansView } from './components/ExamAndLessonPlansView';
import { LessonStudyView } from './components/LessonStudyView';
import { DirectivesView } from './components/DirectivesView';
import { MeetingNoticesView } from './components/MeetingNoticesView';
import { EmulationEvaluationView } from './components/EmulationEvaluationView';
import { ClassTimetableView } from './components/ClassTimetableView';
import { MemberManagementModal } from './components/MemberManagementModal';
import { PromptModal } from './components/PromptModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';

// Sanitizer to guarantee data consistency and correct role assignment for Khối 2
export const sanitizeMonthlyReport = (
  r: MonthlyReport, 
  allMembers: TeacherMember[]
): MonthlyReport => {
  const leader = allMembers.find(m => m.isLeader || m.name.includes('Kim Ngọc'));
  const leaderName = leader?.name || 'Nguyễn Kim Ngọc';

  // If a report was mistakenly marked with Tổ trưởng name (since Tổ trưởng doesn't submit homeroom report directly)
  if (
    r.teacherName.includes('Kim Ngọc') || 
    r.teacherId === leader?.id || 
    (r.className && r.className.includes('Tổ trưởng'))
  ) {
    const matchedHomeroom = allMembers.find(
      m => !m.isLeader && (m.id === r.classId || m.assignedClass === r.className)
    );
    if (matchedHomeroom) {
      return {
        ...r,
        classId: matchedHomeroom.id,
        className: matchedHomeroom.assignedClass,
        teacherId: matchedHomeroom.id,
        teacherName: matchedHomeroom.name,
        campus: matchedHomeroom.campus,
        reviewedBy: `Tổ trưởng ${leaderName}`
      };
    }
  }

  // Ensure reports match their teacher by teacherId or className
  const targetTeacher = allMembers.find(m => m.id === r.teacherId || m.assignedClass === r.className);
  if (targetTeacher && !targetTeacher.isLeader) {
    return {
      ...r,
      classId: targetTeacher.id,
      className: targetTeacher.assignedClass,
      teacherId: targetTeacher.id,
      teacherName: targetTeacher.name,
      campus: targetTeacher.campus,
      reviewedBy: r.status === 'Đã duyệt' ? (r.reviewedBy || `Tổ trưởng ${leaderName}`) : r.reviewedBy
    };
  }

  return r;
};

export default function App() {
  // App Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('mylac_k2_settings') || localStorage.getItem('tanthanh_k5_settings');
    return saved ? JSON.parse(saved) : INITIAL_APP_SETTINGS;
  });

  // Leader Secret Password (Default: Tt112233 - exclusive to Cô Nguyễn Kim Ngọc)
  const [secretPasswordLeader, setSecretPasswordLeader] = useState<string>(() => {
    return localStorage.getItem('mylac_k2_leader_pass') || localStorage.getItem('tanthanh_k5_leader_pass') || 'Tt112233';
  });

  // Members list (ensure Nguyễn Thị Kim Ngọc is Tổ trưởng Khối 2)
  const [members, setMembers] = useState<TeacherMember[]>(() => {
    const saved = localStorage.getItem('mylac_k2_members');
    if (!saved) return INITIAL_MEMBERS;
    try {
      const parsed: TeacherMember[] = JSON.parse(saved);
      return parsed.map(m => {
        if (m.name.includes('Kim Ngọc') || m.id === 'gv-2') {
          return { ...m, isLeader: true, assignedClass: 'Tổ trưởng Chuyên môn Khối 2' };
        }
        return m;
      });
    } catch {
      return INITIAL_MEMBERS;
    }
  });

  // Current active user (defaults to leader Cô Nguyễn Kim Ngọc)
  const [currentUser, setCurrentUser] = useState<TeacherMember>(() => {
    return members.find(m => m.name.includes('Kim Ngọc') || m.isLeader) || members[0];
  });

  // Navigation tab
  const [activeTab, setActiveTab] = useState<TabType>('reports');

  // Module data states (healed with sanitizeMonthlyReport)
  const [reports, setReports] = useState<MonthlyReport[]>(() => {
    const saved = localStorage.getItem('tanthanh_k5_reports');
    if (!saved) return INITIAL_MONTHLY_REPORTS;
    try {
      const parsed: MonthlyReport[] = JSON.parse(saved);
      return parsed.map(r => sanitizeMonthlyReport(r, INITIAL_MEMBERS));
    } catch {
      return INITIAL_MONTHLY_REPORTS;
    }
  });

  const [strugglingStudents, setStrugglingStudents] = useState<StrugglingStudent[]>(() => {
    const saved = localStorage.getItem('tanthanh_k5_struggling');
    return saved ? JSON.parse(saved) : INITIAL_STRUGGLING_STUDENTS;
  });

  const [teamDocuments, setTeamDocuments] = useState<TeamPlanDocument[]>(() => {
    const saved = localStorage.getItem('mylac_k2_team_docs') || localStorage.getItem('tanthanh_k5_team_docs');
    return saved ? JSON.parse(saved) : INITIAL_TEAM_DOCUMENTS;
  });

  const [examsAndPlans, setExamsAndPlans] = useState<ExamAndLessonPlan[]>(() => {
    const saved = localStorage.getItem('mylac_k2_exams') || localStorage.getItem('tanthanh_k5_exams');
    return saved ? JSON.parse(saved) : INITIAL_EXAMS_AND_PLANS;
  });

  const [lessonStudies, setLessonStudies] = useState<LessonStudyTopic[]>(() => {
    const saved = localStorage.getItem('mylac_k2_lesson_studies') || localStorage.getItem('tanthanh_k5_lesson_studies');
    return saved ? JSON.parse(saved) : INITIAL_LESSON_STUDIES;
  });

  // Separated: Directives (Công văn chỉ đạo)
  const [directives, setDirectives] = useState<SchoolDirective[]>(() => {
    const saved = localStorage.getItem('mylac_k2_directives') || localStorage.getItem('tanthanh_k5_directives');
    return saved ? JSON.parse(saved) : INITIAL_DIRECTIVES;
  });

  // Separated: Meetings (Thông báo họp Zoom)
  const [meetings, setMeetings] = useState<MeetingNotice[]>(() => {
    const saved = localStorage.getItem('mylac_k2_meetings') || localStorage.getItem('tanthanh_k5_meetings');
    return saved ? JSON.parse(saved) : INITIAL_MEETINGS;
  });

  // Emulation records & uploaded documents
  const [emulations, setEmulations] = useState<EmulationRecord[]>(() => {
    const saved = localStorage.getItem('mylac_k2_emulations') || localStorage.getItem('tanthanh_k5_emulations');
    return saved ? JSON.parse(saved) : INITIAL_EMULATIONS;
  });

  const [emulationDocuments, setEmulationDocuments] = useState<EmulationDocument[]>(() => {
    const saved = localStorage.getItem('mylac_k2_emulation_docs') || localStorage.getItem('tanthanh_k5_emulation_docs');
    return saved ? JSON.parse(saved) : [];
  });

  // Timetables (Thời khóa biểu - only shows when teachers upload)
  const [timetables, setTimetables] = useState<ClassTimetable[]>(() => {
    const saved = localStorage.getItem('mylac_k2_timetables') || localStorage.getItem('tanthanh_k5_timetables');
    return saved ? JSON.parse(saved) : INITIAL_TIMETABLES;
  });

  // Modals state
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showPromptModal, setShowPromptModal] = useState<boolean>(false);
  const [showBackupModal, setShowBackupModal] = useState<boolean>(false);

  // Online Sync & Multi-Account Sharing states
  const [userEmail, setUserEmail] = useState<string>(() => {
    return getActiveUserEmail('ngoctokhoi2@gmail.com');
  });
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [activePeers, setActivePeers] = useState<number>(1);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [lastSavedBy, setLastSavedBy] = useState<string | null>(null);

  // Asynchronously hydrate from IndexedDB on startup (long-term persistent storage)
  const reloadAllDataFromStorage = useCallback(async () => {
    try {
      const [
        savedSettings,
        savedPass,
        savedMembers,
        savedReports,
        savedStruggling,
        savedTeamDocs,
        savedExams,
        savedLessons,
        savedDirectives,
        savedMeetings,
        savedEmulations,
        savedEmuDocs,
        savedTimetables
      ] = await Promise.all([
        loadPersistentData('settings', INITIAL_APP_SETTINGS),
        loadPersistentData('leader_pass', 'Tt112233'),
        loadPersistentData('members', INITIAL_MEMBERS),
        loadPersistentData('reports', INITIAL_MONTHLY_REPORTS),
        loadPersistentData('struggling', INITIAL_STRUGGLING_STUDENTS),
        loadPersistentData('team_docs', INITIAL_TEAM_DOCUMENTS),
        loadPersistentData('exams', INITIAL_EXAMS_AND_PLANS),
        loadPersistentData('lesson_studies', INITIAL_LESSON_STUDIES),
        loadPersistentData('directives', INITIAL_DIRECTIVES),
        loadPersistentData('meetings', INITIAL_MEETINGS),
        loadPersistentData('emulations', INITIAL_EMULATIONS),
        loadPersistentData('emulation_docs', [] as EmulationDocument[]),
        loadPersistentData('timetables', INITIAL_TIMETABLES)
      ]);

      if (savedSettings) setSettings(savedSettings);
      if (savedPass) setSecretPasswordLeader(savedPass);
      let currentMembersList = members;
      if (savedMembers && savedMembers.length > 0) {
        currentMembersList = savedMembers.map(m => {
          if (m.name.includes('Kim Ngọc') || m.id === 'gv-2') {
            return { ...m, isLeader: true, assignedClass: 'Tổ trưởng Chuyên môn Khối 2' };
          }
          return m;
        });
        setMembers(currentMembersList);
        const currentFound = currentMembersList.find(m => m.name.includes('Kim Ngọc') || m.isLeader) || currentMembersList[0];
        setCurrentUser(currentFound);
      }
      if (savedReports && savedReports.length > 0) {
        setReports(savedReports.map(r => sanitizeMonthlyReport(r, currentMembersList)));
      } else if (savedReports) {
        setReports(savedReports);
      }
      if (savedStruggling) setStrugglingStudents(savedStruggling);
      if (savedTeamDocs) setTeamDocuments(savedTeamDocs);
      if (savedExams) setExamsAndPlans(savedExams);
      if (savedLessons) setLessonStudies(savedLessons);
      if (savedDirectives) setDirectives(savedDirectives);
      if (savedMeetings) setMeetings(savedMeetings);
      if (savedEmulations) setEmulations(savedEmulations);
      if (savedEmuDocs) setEmulationDocuments(savedEmuDocs);
      if (savedTimetables) setTimetables(savedTimetables);
    } catch (err) {
      console.warn('Error loading from persistent storage, using current memory state', err);
    }
  }, []);

  useEffect(() => {
    reloadAllDataFromStorage();
    testFirestoreConnection().then(connected => {
      if (connected) setIsOnline(true);
    }).catch(() => {});
  }, [reloadAllDataFromStorage]);

  // Self-healing migration for reports
  useEffect(() => {
    setReports(prev => {
      let changed = false;
      const healed = prev.map(r => {
        const fixed = sanitizeMonthlyReport(r, members);
        if (
          fixed.teacherName !== r.teacherName || 
          fixed.className !== r.className || 
          fixed.teacherId !== r.teacherId
        ) {
          changed = true;
          return fixed;
        }
        return r;
      });
      if (changed) {
        localStorage.setItem('mylac_k2_reports', JSON.stringify(healed));
        savePersistentData('reports', healed);
        return healed;
      }
      return prev;
    });
  }, [members]);

  // Sync to both localStorage and IndexedDB persistent storage whenever state changes
  useEffect(() => {
    localStorage.setItem('mylac_k2_settings', JSON.stringify(settings));
    savePersistentData('settings', settings);
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('mylac_k2_leader_pass', secretPasswordLeader);
    savePersistentData('leader_pass', secretPasswordLeader);
  }, [secretPasswordLeader]);

  useEffect(() => {
    localStorage.setItem('mylac_k2_members', JSON.stringify(members));
    savePersistentData('members', members);
    const found = members.find(m => m.id === currentUser.id);
    if (found) setCurrentUser(found);
  }, [members]);

  useEffect(() => {
    localStorage.setItem('mylac_k2_reports', JSON.stringify(reports));
    savePersistentData('reports', reports);
  }, [reports]);

  useEffect(() => {
    localStorage.setItem('mylac_k2_struggling', JSON.stringify(strugglingStudents));
    savePersistentData('struggling', strugglingStudents);
  }, [strugglingStudents]);

  useEffect(() => {
    localStorage.setItem('mylac_k2_team_docs', JSON.stringify(teamDocuments));
    savePersistentData('team_docs', teamDocuments);
  }, [teamDocuments]);

  useEffect(() => {
    localStorage.setItem('mylac_k2_exams', JSON.stringify(examsAndPlans));
    savePersistentData('exams', examsAndPlans);
  }, [examsAndPlans]);

  useEffect(() => {
    localStorage.setItem('mylac_k2_lesson_studies', JSON.stringify(lessonStudies));
    savePersistentData('lesson_studies', lessonStudies);
  }, [lessonStudies]);

  useEffect(() => {
    localStorage.setItem('mylac_k2_directives', JSON.stringify(directives));
    savePersistentData('directives', directives);
  }, [directives]);

  useEffect(() => {
    localStorage.setItem('mylac_k2_meetings', JSON.stringify(meetings));
    savePersistentData('meetings', meetings);
  }, [meetings]);

  useEffect(() => {
    localStorage.setItem('mylac_k2_emulations', JSON.stringify(emulations));
    savePersistentData('emulations', emulations);
  }, [emulations]);

  useEffect(() => {
    localStorage.setItem('mylac_k2_emulation_docs', JSON.stringify(emulationDocuments));
    savePersistentData('emulation_docs', emulationDocuments);
  }, [emulationDocuments]);

  useEffect(() => {
    localStorage.setItem('mylac_k2_timetables', JSON.stringify(timetables));
    savePersistentData('timetables', timetables);
  }, [timetables]);

  // Construct current full payload for saving & online sharing
  const getCurrentFullDataPayload = useCallback(() => {
    return {
      settings,
      leader_pass: secretPasswordLeader,
      members,
      reports,
      struggling: strugglingStudents,
      team_docs: teamDocuments,
      exams: examsAndPlans,
      lesson_studies: lessonStudies,
      directives,
      meetings,
      emulations,
      emulation_docs: emulationDocuments,
      timetables
    };
  }, [
    settings,
    secretPasswordLeader,
    members,
    reports,
    strugglingStudents,
    teamDocuments,
    examsAndPlans,
    lessonStudies,
    directives,
    meetings,
    emulations,
    emulationDocuments,
    timetables
  ]);

  const isApplyingRemoteUpdateRef = useRef(false);
  const isInitialLoadedRef = useRef(false);

  const membersRef = useRef(members);
  useEffect(() => {
    membersRef.current = members;
  }, [members]);

  const userEmailRef = useRef(userEmail);
  useEffect(() => {
    userEmailRef.current = userEmail;
  }, [userEmail]);

  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Apply server data received via real-time SSE stream or pull
  const applyIncomingServerData = useCallback((sData: any, authorName?: string, authorEmail?: string) => {
    if (!sData || typeof sData !== 'object') return;
    isApplyingRemoteUpdateRef.current = true;

    if (sData.settings) {
      setSettings(prev => JSON.stringify(prev) === JSON.stringify(sData.settings) ? prev : sData.settings);
    }
    if (sData.leader_pass) {
      setSecretPasswordLeader(prev => prev === sData.leader_pass ? prev : sData.leader_pass);
    }

    let activeMembers = membersRef.current;
    if (sData.members && sData.members.length > 0) {
      activeMembers = sData.members.map((m: TeacherMember) => {
        if (m.name.includes('Kim Ngọc') || m.id === 'gv-2') {
          return { ...m, isLeader: true, assignedClass: 'Tổ trưởng Chuyên môn Khối 2' };
        }
        return m;
      });
      setMembers(prev => JSON.stringify(prev) === JSON.stringify(activeMembers) ? prev : activeMembers);
    }

    if (sData.reports && Array.isArray(sData.reports) && sData.reports.length > 0) {
      const sanitized = sData.reports.map((r: MonthlyReport) => sanitizeMonthlyReport(r, activeMembers));
      setReports(prev => JSON.stringify(prev) === JSON.stringify(sanitized) ? prev : sanitized);
    }
    if (sData.struggling && Array.isArray(sData.struggling)) {
      setStrugglingStudents(prev => JSON.stringify(prev) === JSON.stringify(sData.struggling) ? prev : sData.struggling);
    }
    if (sData.team_docs && Array.isArray(sData.team_docs)) {
      setTeamDocuments(prev => JSON.stringify(prev) === JSON.stringify(sData.team_docs) ? prev : sData.team_docs);
    }
    if (sData.exams && Array.isArray(sData.exams)) {
      setExamsAndPlans(prev => JSON.stringify(prev) === JSON.stringify(sData.exams) ? prev : sData.exams);
    }
    if (sData.lesson_studies && Array.isArray(sData.lesson_studies)) {
      setLessonStudies(prev => JSON.stringify(prev) === JSON.stringify(sData.lesson_studies) ? prev : sData.lesson_studies);
    }
    if (sData.directives && Array.isArray(sData.directives)) {
      setDirectives(prev => JSON.stringify(prev) === JSON.stringify(sData.directives) ? prev : sData.directives);
    }
    if (sData.meetings && Array.isArray(sData.meetings)) {
      setMeetings(prev => JSON.stringify(prev) === JSON.stringify(sData.meetings) ? prev : sData.meetings);
    }
    if (sData.emulations && Array.isArray(sData.emulations)) {
      setEmulations(prev => JSON.stringify(prev) === JSON.stringify(sData.emulations) ? prev : sData.emulations);
    }
    if (sData.emulation_docs && Array.isArray(sData.emulation_docs)) {
      setEmulationDocuments(prev => JSON.stringify(prev) === JSON.stringify(sData.emulation_docs) ? prev : sData.emulation_docs);
    }
    if (sData.timetables && Array.isArray(sData.timetables)) {
      setTimetables(prev => JSON.stringify(prev) === JSON.stringify(sData.timetables) ? prev : sData.timetables);
    }

    const nowStr = new Date().toLocaleTimeString('vi-VN');
    setLastSavedTime(nowStr);
    if (authorName) {
      setLastSavedBy(`${authorName}${authorEmail ? ` (${authorEmail})` : ''}`);
    }

    setTimeout(() => {
      isApplyingRemoteUpdateRef.current = false;
    }, 400);
  }, []);

  // Pull latest updates from online server (shared across email accounts)
  const handlePullOnlineUpdates = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsSyncing(true);
    try {
      const res = await pullDataFromOnlineServer(userEmailRef.current, currentUserRef.current.name);
      setIsOnline(true);
      if (res.data && Object.keys(res.data).length > 0) {
        applyIncomingServerData(
          res.data,
          res.metadata?.lastUpdatedByName,
          res.metadata?.lastUpdatedByEmail
        );
      }
    } catch (err) {
      console.warn('[OnlineSync] Failed to pull online updates:', err);
    } finally {
      if (!isSilent) setIsSyncing(false);
    }
  }, [applyIncomingServerData]);

  // Command: Ghi nhớ & Lưu tất cả ngay (trước khi thoát)
  const handleManualSaveAndMemorize = async () => {
    setIsSyncing(true);
    try {
      const payload = getCurrentFullDataPayload();
      // 1. Force flush to persistent local storage (IndexedDB)
      await Promise.all([
        savePersistentData('settings', payload.settings),
        savePersistentData('leader_pass', payload.leader_pass),
        savePersistentData('members', payload.members),
        savePersistentData('reports', payload.reports),
        savePersistentData('struggling', payload.struggling),
        savePersistentData('team_docs', payload.team_docs),
        savePersistentData('exams', payload.exams),
        savePersistentData('lesson_studies', payload.lesson_studies),
        savePersistentData('directives', payload.directives),
        savePersistentData('meetings', payload.meetings),
        savePersistentData('emulations', payload.emulations),
        savePersistentData('emulation_docs', payload.emulation_docs),
        savePersistentData('timetables', payload.timetables)
      ]);

      // 2. Push to Google Cloud Firestore (for immediate multi-device synchronization)
      await saveFullStateToFirestore(payload, userEmail, currentUser.name);

      // 3. Push to Online Server for all shared email accounts
      await pushDataToOnlineServer(payload, userEmail, currentUser.name);
      setIsOnline(true);
      const nowStr = new Date().toLocaleTimeString('vi-VN');
      setLastSavedTime(nowStr);
      setLastSavedBy(`${currentUser.name} (${userEmail})`);
    } catch (err) {
      console.warn('[OnlineSync] Push fallback to local storage:', err);
      const nowStr = new Date().toLocaleTimeString('vi-VN');
      setLastSavedTime(nowStr);
      setLastSavedBy(`${currentUser.name} (Bộ nhớ máy)`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Switch active email
  const handleUserEmailChange = (newEmail: string) => {
    const cleaned = newEmail.trim();
    if (cleaned) {
      setUserEmail(cleaned);
      setActiveUserEmail(cleaned);
    }
  };

  // Exit protection: Auto-save before browser unload or visibility hidden
  useEffect(() => {
    const handleBeforeUnload = () => {
      const payload = getCurrentFullDataPayload();
      sendBeaconSync(payload, userEmail, currentUser.name);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const payload = getCurrentFullDataPayload();
        sendBeaconSync(payload, userEmail, currentUser.name);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [getCurrentFullDataPayload, userEmail, currentUser.name]);

  // Google Cloud Firestore Real-time multi-device synchronization
  useEffect(() => {
    const markRemoteUpdate = () => {
      isApplyingRemoteUpdateRef.current = true;
      setTimeout(() => {
        isApplyingRemoteUpdateRef.current = false;
      }, 500);
    };

    const unsubscribeFirestore = subscribeToAllFirestoreData({
      onReportsUpdate: (firestoreReports) => {
        if (Array.isArray(firestoreReports)) {
          markRemoteUpdate();
          const sanitized = firestoreReports.map(r => sanitizeMonthlyReport(r, membersRef.current));
          setReports(prev => JSON.stringify(prev) === JSON.stringify(sanitized) ? prev : sanitized);
          setIsOnline(true);
        }
      },
      onStrugglingUpdate: (firestoreStudents) => {
        if (Array.isArray(firestoreStudents)) {
          markRemoteUpdate();
          setStrugglingStudents(prev => JSON.stringify(prev) === JSON.stringify(firestoreStudents) ? prev : firestoreStudents);
          setIsOnline(true);
        }
      },
      onTeamDocsUpdate: (firestoreDocs) => {
        if (Array.isArray(firestoreDocs)) {
          markRemoteUpdate();
          setTeamDocuments(prev => JSON.stringify(prev) === JSON.stringify(firestoreDocs) ? prev : firestoreDocs);
        }
      },
      onExamsUpdate: (firestoreExams) => {
        if (Array.isArray(firestoreExams)) {
          markRemoteUpdate();
          setExamsAndPlans(prev => JSON.stringify(prev) === JSON.stringify(firestoreExams) ? prev : firestoreExams);
        }
      },
      onLessonStudiesUpdate: (firestoreStudies) => {
        if (Array.isArray(firestoreStudies)) {
          markRemoteUpdate();
          setLessonStudies(prev => JSON.stringify(prev) === JSON.stringify(firestoreStudies) ? prev : firestoreStudies);
        }
      },
      onDirectivesUpdate: (firestoreDirectives) => {
        if (Array.isArray(firestoreDirectives)) {
          markRemoteUpdate();
          setDirectives(prev => JSON.stringify(prev) === JSON.stringify(firestoreDirectives) ? prev : firestoreDirectives);
        }
      },
      onMeetingsUpdate: (firestoreMeetings) => {
        if (Array.isArray(firestoreMeetings)) {
          markRemoteUpdate();
          setMeetings(prev => JSON.stringify(prev) === JSON.stringify(firestoreMeetings) ? prev : firestoreMeetings);
        }
      },
      onEmulationsUpdate: (firestoreEmus) => {
        if (Array.isArray(firestoreEmus)) {
          markRemoteUpdate();
          setEmulations(prev => JSON.stringify(prev) === JSON.stringify(firestoreEmus) ? prev : firestoreEmus);
        }
      },
      onEmulationDocsUpdate: (firestoreEmuDocs) => {
        if (Array.isArray(firestoreEmuDocs)) {
          markRemoteUpdate();
          setEmulationDocuments(prev => JSON.stringify(prev) === JSON.stringify(firestoreEmuDocs) ? prev : firestoreEmuDocs);
        }
      },
      onTimetablesUpdate: (firestoreTimetables) => {
        if (Array.isArray(firestoreTimetables)) {
          markRemoteUpdate();
          setTimetables(prev => JSON.stringify(prev) === JSON.stringify(firestoreTimetables) ? prev : firestoreTimetables);
        }
      },
      onSettingsUpdate: (firestoreSettings) => {
        if (firestoreSettings) {
          markRemoteUpdate();
          setSettings(prev => JSON.stringify(prev) === JSON.stringify(firestoreSettings) ? prev : firestoreSettings);
        }
      },
      onMembersUpdate: (firestoreMembers) => {
        if (Array.isArray(firestoreMembers) && firestoreMembers.length > 0) {
          markRemoteUpdate();
          const activeMembers = firestoreMembers.map(m => {
            if (m.name.includes('Kim Ngọc') || m.id === 'gv-2') {
              return { ...m, isLeader: true, assignedClass: 'Tổ trưởng Chuyên môn Khối 2' };
            }
            return m;
          });
          setMembers(prev => JSON.stringify(prev) === JSON.stringify(activeMembers) ? prev : activeMembers);
        }
      },
      onSyncMetaUpdate: (meta) => {
        setLastSavedTime(meta.lastSavedTime);
        setLastSavedBy(meta.lastSavedBy);
      }
    });

    return () => {
      unsubscribeFirestore();
    };
  }, []);

  // Real-time instant SSE multi-device synchronization
  useEffect(() => {
    // 1. Initial pull
    handlePullOnlineUpdates(true);

    // 2. Real-time instant SSE stream: When another teacher inputs data, it arrives here in <100ms
    const unsubscribe = subscribeToOnlineUpdates(
      (incomingData, _rev, authorName, authorEmail) => {
        setIsOnline(true);
        applyIncomingServerData(incomingData, authorName, authorEmail);
      },
      (onlineStatus, peers) => {
        setIsOnline(onlineStatus);
        if (peers !== undefined && peers > 0) {
          setActivePeers(peers);
        }
      },
      userEmail,
      currentUser.name
    );

    // 3. Fallback fast poll every 4 seconds in case SSE drops
    const pollInterval = setInterval(async () => {
      try {
        const status = await checkServerSyncStatus();
        if (status.success) {
          setIsOnline(true);
          if (status.activeConnectedPeers > 0) {
            setActivePeers(status.activeConnectedPeers);
          }
          const localRev = getLastKnownRevision();
          if (status.revision > localRev) {
            handlePullOnlineUpdates(true);
          }
        }
      } catch {
        const fsOnline = await testFirestoreConnection();
        setIsOnline(fsOnline);
      }
    }, 4000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [userEmail, currentUser.name, handlePullOnlineUpdates, applyIncomingServerData]);

  // Debounced auto-push to server whenever any data changes locally
  useEffect(() => {
    if (!isInitialLoadedRef.current) {
      const t = setTimeout(() => {
        isInitialLoadedRef.current = true;
      }, 1500);
      return () => clearTimeout(t);
    }

    if (isApplyingRemoteUpdateRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      const payload = getCurrentFullDataPayload();
      pushDataToOnlineServer(payload, userEmail, currentUser.name)
        .then(() => {
          setIsOnline(true);
          setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
          setLastSavedBy(`${currentUser.name} (${userEmail})`);
        })
        .catch((err) => {
          console.warn('[AutoSync] Cloud push error:', err);
        });
    }, 500);

    return () => clearTimeout(timer);
  }, [
    getCurrentFullDataPayload,
    userEmail,
    currentUser.name,
    settings,
    secretPasswordLeader,
    members,
    reports,
    strugglingStudents,
    teamDocuments,
    examsAndPlans,
    lessonStudies,
    directives,
    meetings,
    emulations,
    emulationDocuments,
    timetables
  ]);

  // Handler functions for Thanh lệnh 1: Reports
  const handleSaveReport = (report: MonthlyReport) => {
    const sanitized = sanitizeMonthlyReport(report, members);
    setReports(prev => {
      const exists = prev.some(r => r.id === sanitized.id);
      if (exists) {
        return prev.map(r => r.id === sanitized.id ? sanitized : r);
      }
      return [sanitized, ...prev];
    });
    // Instant Firestore replication to all connected machines & ngoctokhoi2@gmail.com
    saveReportToFirestore(sanitized, userEmail, currentUser.name).catch(e => console.warn('Firestore report save error:', e));
    pushDataToOnlineServer({ reports: [sanitized] }, userEmail, currentUser.name).catch(() => {});
  };

  const handleDeleteReport = (id: string) => {
    setReports(prev => prev.filter(r => r.id !== id));
    deleteReportFromFirestore(id, userEmail, currentUser.name).catch(e => console.warn('Firestore report delete error:', e));
    deleteDataFromOnlineServer('reports', id, userEmail, currentUser.name).catch(() => {});
  };

  // Handler functions for Thanh lệnh 2: Struggling Students
  const handleAddStudent = (student: StrugglingStudent) => {
    setStrugglingStudents(prev => [student, ...prev]);
    saveStudentToFirestore(student, userEmail, currentUser.name).catch(e => console.warn('Firestore student save error:', e));
    pushDataToOnlineServer({ struggling: [student] }, userEmail, currentUser.name).catch(() => {});
  };

  const handleUpdateStudent = (student: StrugglingStudent) => {
    setStrugglingStudents(prev => prev.map(s => s.id === student.id ? student : s));
    saveStudentToFirestore(student, userEmail, currentUser.name).catch(e => console.warn('Firestore student update error:', e));
    pushDataToOnlineServer({ struggling: [student] }, userEmail, currentUser.name).catch(() => {});
  };

  const handleRemoveStudent = (id: string) => {
    setStrugglingStudents(prev => prev.filter(s => s.id !== id));
    deleteStudentFromFirestore(id, userEmail, currentUser.name).catch(e => console.warn('Firestore student delete error:', e));
    deleteDataFromOnlineServer('struggling', id, userEmail, currentUser.name).catch(() => {});
  };

  // Handler functions for Thanh lệnh 3: Team Documents
  const handleUploadDocument = (doc: TeamPlanDocument) => {
    setTeamDocuments(prev => [doc, ...prev]);
    saveTeamDocToFirestore(doc, userEmail, currentUser.name).catch(e => console.warn('Firestore team doc save error:', e));
    pushDataToOnlineServer({ team_docs: [doc] }, userEmail, currentUser.name).catch(() => {});
  };

  const handleDeleteDocument = (id: string) => {
    if (!isHostServerDevice(userEmail)) {
      alert('Chỉ máy chủ Tài khoản ngoctokhoi2@gmail.com mới có quyền xóa Kế hoạch Tổ và Phân phối chương trình (PPCT)! Các máy chia sẻ / máy lẻ chỉ có quyền xem và tải xuống.');
      return;
    }
    setTeamDocuments(prev => prev.filter(d => d.id !== id));
    deleteTeamDocFromFirestore(id, userEmail, currentUser.name).catch(e => console.warn('Firestore team doc delete error:', e));
    deleteDataFromOnlineServer('team_docs', id, userEmail, currentUser.name).catch(() => {});
  };

  // Handler functions for Thanh lệnh 4: Exams & Plans
  const handleSaveExamItem = (item: ExamAndLessonPlan) => {
    setExamsAndPlans(prev => {
      const exists = prev.some(it => it.id === item.id);
      if (exists) {
        return prev.map(it => it.id === item.id ? item : it);
      }
      return [item, ...prev];
    });
    saveExamToFirestore(item, userEmail, currentUser.name).catch(e => console.warn('Firestore exam save error:', e));
    pushDataToOnlineServer({ exams: [item] }, userEmail, currentUser.name).catch(() => {});
  };

  const handleApproveExamItem = (id: string, status: 'Đã duyệt' | 'Yêu cầu chỉnh sửa', reviewNote: string) => {
    const leaderName = members.find(m => m.isLeader)?.name || 'Nguyễn Kim Ngọc';
    setExamsAndPlans(prev => prev.map(item => {
      if (item.id === id) {
        const updated: ExamAndLessonPlan = {
          ...item,
          status,
          reviewNote,
          reviewedBy: `Tổ trưởng ${leaderName}`,
          reviewedAt: new Date().toLocaleDateString('vi-VN')
        };
        saveExamToFirestore(updated, userEmail, currentUser.name).catch(e => console.warn('Firestore exam approve error:', e));
        pushDataToOnlineServer({ exams: [updated] }, userEmail, currentUser.name).catch(() => {});
        return updated;
      }
      return item;
    }));
  };

  const handleDeleteExamItem = (id: string) => {
    if (!isHostServerDevice(userEmail)) {
      alert('Chỉ máy chủ Tài khoản ngoctokhoi2@gmail.com mới có quyền xóa KHDH và Đề thi! Các máy chia sẻ / máy lẻ chỉ có quyền xem và tải xuống.');
      return;
    }
    setExamsAndPlans(prev => prev.filter(item => item.id !== id));
    deleteExamFromFirestore(id, userEmail, currentUser.name).catch(e => console.warn('Firestore exam delete error:', e));
    deleteDataFromOnlineServer('exams', id, userEmail, currentUser.name).catch(() => {});
  };

  // Handler functions for Thanh lệnh 5: Lesson Studies
  const handleSaveTopic = (topic: LessonStudyTopic) => {
    setLessonStudies(prev => [topic, ...prev]);
    saveLessonStudyToFirestore(topic, userEmail, currentUser.name).catch(e => console.warn('Firestore lesson save error:', e));
    pushDataToOnlineServer({ lesson_studies: [topic] }, userEmail, currentUser.name).catch(() => {});
  };

  const handleAddFeedback = (topicId: string, feedback: LessonStudyFeedback) => {
    setLessonStudies(prev => prev.map(t => {
      if (t.id === topicId) {
        const updated = {
          ...t,
          feedbacks: [...(t.feedbacks || []), feedback]
        };
        saveLessonStudyToFirestore(updated, userEmail, currentUser.name).catch(e => console.warn('Firestore feedback save error:', e));
        pushDataToOnlineServer({ lesson_studies: [updated] }, userEmail, currentUser.name).catch(() => {});
        return updated;
      }
      return t;
    }));
  };

  const handleDeleteTopic = (id: string) => {
    setLessonStudies(prev => prev.filter(t => t.id !== id));
    deleteLessonStudyFromFirestore(id, userEmail, currentUser.name).catch(e => console.warn('Firestore lesson delete error:', e));
    deleteDataFromOnlineServer('lesson_studies', id, userEmail, currentUser.name).catch(() => {});
  };

  const handleDeleteFeedback = (topicId: string, feedbackId: string) => {
    setLessonStudies(prev => prev.map(t => {
      if (t.id === topicId) {
        const updated = {
          ...t,
          feedbacks: (t.feedbacks || []).filter(f => f.id !== feedbackId)
        };
        saveLessonStudyToFirestore(updated, userEmail, currentUser.name).catch(e => console.warn('Firestore feedback delete error:', e));
        return updated;
      }
      return t;
    }));
  };

  // Handler functions for Thanh lệnh 6: Directives (Công văn chỉ đạo)
  const handleSaveDirective = (directive: SchoolDirective) => {
    setDirectives(prev => [directive, ...prev]);
    saveDirectiveToFirestore(directive, userEmail, currentUser.name).catch(e => console.warn('Firestore directive save error:', e));
    pushDataToOnlineServer({ directives: [directive] }, userEmail, currentUser.name).catch(() => {});
  };

  const handleDeleteDirective = (id: string) => {
    if (!isHostServerDevice(userEmail)) {
      alert('Chỉ máy chủ Tài khoản ngoctokhoi2@gmail.com mới có quyền xóa Công văn chỉ đạo! Các máy chia sẻ không có chức năng xóa.');
      return;
    }
    setDirectives(prev => prev.filter(d => d.id !== id));
    deleteDirectiveFromFirestore(id, userEmail, currentUser.name).catch(e => console.warn('Firestore directive delete error:', e));
    deleteDataFromOnlineServer('directives', id, userEmail, currentUser.name).catch(() => {});
  };

  // Handler functions for Thanh lệnh 7: Meetings (Thông báo họp Zoom)
  const handleSaveMeeting = (meeting: MeetingNotice) => {
    setMeetings(prev => [meeting, ...prev]);
    saveMeetingToFirestore(meeting, userEmail, currentUser.name).catch(e => console.warn('Firestore meeting save error:', e));
    pushDataToOnlineServer({ meetings: [meeting] }, userEmail, currentUser.name).catch(() => {});
  };

  const handleDeleteMeeting = (id: string) => {
    if (!isHostServerDevice(userEmail)) {
      alert('Chỉ máy chủ Tài khoản ngoctokhoi2@gmail.com mới có quyền xóa Thông báo họp! Các máy chia sẻ không có chức năng xóa.');
      return;
    }
    setMeetings(prev => prev.filter(m => m.id !== id));
    deleteMeetingFromFirestore(id, userEmail, currentUser.name).catch(e => console.warn('Firestore meeting delete error:', e));
    deleteDataFromOnlineServer('meetings', id, userEmail, currentUser.name).catch(() => {});
  };

  // Handler functions for Thanh lệnh 8: Class Timetables (TKB)
  const handleSaveTimetable = (timetable: ClassTimetable) => {
    setTimetables(prev => {
      const exists = prev.some(t => t.id === timetable.id);
      if (exists) {
        return prev.map(t => t.id === timetable.id ? timetable : t);
      }
      return [timetable, ...prev];
    });
    saveTimetableToFirestore(timetable, userEmail, currentUser.name).catch(e => console.warn('Firestore timetable save error:', e));
    pushDataToOnlineServer({ timetables: [timetable] }, userEmail, currentUser.name).catch(() => {});
  };

  const handleDeleteTimetable = (id: string) => {
    setTimetables(prev => prev.filter(t => t.id !== id));
    deleteTimetableFromFirestore(id, userEmail, currentUser.name).catch(e => console.warn('Firestore timetable delete error:', e));
    deleteDataFromOnlineServer('timetables', id, userEmail, currentUser.name).catch(() => {});
  };

  const handleApproveTimetable = (id: string, status: 'Đã duyệt' | 'Áp dụng chính thức' | 'Chờ duyệt', feedback?: string) => {
    const leaderName = members.find(m => m.isLeader)?.name || 'Nguyễn Kim Ngọc';
    setTimetables(prev => prev.map(t => {
      if (t.id === id) {
        const updated: ClassTimetable = {
          ...t,
          status,
          reviewedBy: `Tổ trưởng ${leaderName}`,
          leaderFeedback: feedback || 'Tổ trưởng đã thẩm định và phê duyệt áp dụng chính thức.',
          updatedAt: new Date().toLocaleDateString('vi-VN')
        };
        saveTimetableToFirestore(updated, userEmail, currentUser.name).catch(e => console.warn('Firestore timetable approve error:', e));
        pushDataToOnlineServer({ timetables: [updated] }, userEmail, currentUser.name).catch(() => {});
        return updated;
      }
      return t;
    }));
  };

  // Handler functions for Thanh lệnh 9: Emulations (Xét thi đua)
  const handleSaveEmulation = (record: EmulationRecord) => {
    setEmulations(prev => {
      const exists = prev.some(r => r.id === record.id);
      if (exists) {
        return prev.map(r => r.id === record.id ? record : r);
      }
      return [record, ...prev];
    });
    saveEmulationToFirestore(record, userEmail, currentUser.name).catch(e => console.warn('Firestore emulation save error:', e));
    pushDataToOnlineServer({ emulations: [record] }, userEmail, currentUser.name).catch(() => {});
  };

  const handleDeleteEmulation = (id: string) => {
    if (!isHostServerDevice(userEmail)) {
      alert('Chỉ máy chủ Tài khoản ngoctokhoi2@gmail.com mới có quyền xóa Kết quả thi đua! Các máy chia sẻ không có chức năng xóa.');
      return;
    }
    setEmulations(prev => prev.filter(e => e.id !== id));
    deleteEmulationFromFirestore(id, userEmail, currentUser.name).catch(e => console.warn('Firestore emulation delete error:', e));
    deleteDataFromOnlineServer('emulations', id, userEmail, currentUser.name).catch(() => {});
  };

  const handleSaveEmulationDoc = (doc: EmulationDocument) => {
    setEmulationDocuments(prev => [doc, ...prev]);
    saveEmulationDocToFirestore(doc, userEmail, currentUser.name).catch(e => console.warn('Firestore emulation doc save error:', e));
    pushDataToOnlineServer({ emulation_docs: [doc] }, userEmail, currentUser.name).catch(() => {});
  };

  const handleDeleteEmulationDoc = (id: string) => {
    if (!isHostServerDevice(userEmail)) {
      alert('Chỉ máy chủ Tài khoản ngoctokhoi2@gmail.com mới có quyền xóa Tài liệu thi đua! Các máy chia sẻ không có chức năng xóa.');
      return;
    }
    setEmulationDocuments(prev => prev.filter(d => d.id !== id));
    deleteEmulationDocFromFirestore(id, userEmail, currentUser.name).catch(e => console.warn('Firestore emulation doc delete error:', e));
    deleteDataFromOnlineServer('emulation_docs', id, userEmail, currentUser.name).catch(() => {});
  };

  const handleUpdateMembers = (newMembers: TeacherMember[]) => {
    setMembers(newMembers);
    newMembers.forEach(m => {
      saveMemberToFirestore(m, userEmail, currentUser.name).catch(() => {});
    });
    pushDataToOnlineServer({ members: newMembers }, userEmail, currentUser.name).catch(() => {});
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettingsToFirestore(newSettings, userEmail, currentUser.name).catch(() => {});
    pushDataToOnlineServer({ settings: newSettings }, userEmail, currentUser.name).catch(() => {});
  };

  const handleResetToDefault = async () => {
    await clearAllPersistentData();
    setMembers(INITIAL_MEMBERS);
    setCurrentUser(INITIAL_MEMBERS.find(m => m.name.includes('Kim Ngọc') || m.isLeader) || INITIAL_MEMBERS[0]);
    setReports(INITIAL_MONTHLY_REPORTS);
    setStrugglingStudents(INITIAL_STRUGGLING_STUDENTS);
    setTeamDocuments(INITIAL_TEAM_DOCUMENTS);
    setExamsAndPlans(INITIAL_EXAMS_AND_PLANS);
    setLessonStudies(INITIAL_LESSON_STUDIES);
    setDirectives(INITIAL_DIRECTIVES);
    setMeetings(INITIAL_MEETINGS);
    setEmulations(INITIAL_EMULATIONS);
    setEmulationDocuments([]);
    setTimetables(INITIAL_TIMETABLES);
    setSettings(INITIAL_APP_SETTINGS);
    setSecretPasswordLeader('Tt112233');

    // clear localStorage keys
    const keys = [
      'mylac_k2_members',
      'mylac_k2_reports',
      'mylac_k2_timetables',
      'mylac_k2_directives',
      'mylac_k2_meetings',
      'mylac_k2_team_docs',
      'mylac_k2_exams',
      'mylac_k2_emulations',
      'mylac_k2_emulation_docs',
      'tanthanh_k5_members',
      'tanthanh_k5_reports',
      'tanthanh_k5_timetables',
      'tanthanh_k5_directives',
      'tanthanh_k5_meetings',
      'tanthanh_k5_team_docs',
      'tanthanh_k5_exams',
      'tanthanh_k5_emulations',
      'tanthanh_k5_emulation_docs'
    ];
    keys.forEach(k => localStorage.removeItem(k));

    // Clear shared server storage as well
    try {
      await fetch('/api/sync/reset', { method: 'POST' });
    } catch (e) {
      console.warn('Failed to reset shared server storage', e);
    }

    alert('Đã thiết lập lại trạng thái ban đầu của ứng dụng (Cô Nguyễn Thị Kim Ngọc - Tổ trưởng Chuyên môn Khối 2 - Trường Tiểu Học Mỹ Thạnh)!');
  };

  const totalDocumentsCount = 
    reports.length + 
    strugglingStudents.length + 
    teamDocuments.length + 
    examsAndPlans.length + 
    lessonStudies.length + 
    directives.length + 
    meetings.length + 
    timetables.length + 
    emulations.length + 
    emulationDocuments.length;

  const getTabTitle = (tab: TabType): string => {
    switch (tab) {
      case 'reports': return 'Thanh lệnh 1: Báo cáo số liệu HS hàng tháng';
      case 'struggling': return 'Thanh lệnh 2: Theo dõi HS Chậm tiến bộ';
      case 'team-plans': return 'Thanh lệnh 3: Kế hoạch Tổ & PPCT';
      case 'exams-plans': return 'Thanh lệnh 4: KHDH & Ngân hàng Đề thi';
      case 'lesson-study': return 'Thanh lệnh 5: KHBD & NCBH Chuyên đề';
      case 'directives': return 'Thanh lệnh 6: Công văn chỉ đạo';
      case 'meetings': return 'Thanh lệnh 7: Thông báo họp trực tuyến Zoom';
      case 'timetable': return 'Thanh lệnh 8: Thời khóa biểu các lớp';
      case 'emulation': return 'Thanh lệnh 9: Xét thi đua (Word/Excel)';
      default: return 'Thanh lệnh Chuyên môn';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        settings={settings}
        currentUser={currentUser}
        members={members}
        onSelectUser={(selectedUser) => {
          setCurrentUser(selectedUser);
          if (selectedUser.email) {
            setUserEmail(selectedUser.email);
            setActiveUserEmail(selectedUser.email);
            if (selectedUser.email !== 'ngoctokhoi2@gmail.com' && !selectedUser.isLeader) {
              setDeviceMode('shared');
            } else if (selectedUser.email === 'ngoctokhoi2@gmail.com') {
              setDeviceMode('host');
            }
          }
        }}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenPromptModal={() => setShowPromptModal(true)}
        onResetData={handleResetToDefault}
        onOpenBackupModal={() => setShowBackupModal(true)}
      />

      {/* Thanh Lệnh Ghi Nhớ & Đồng Bộ Trực Tuyến Trước Khi Thoát App */}
      <SyncMemorizeBar
        currentUser={currentUser}
        userEmail={userEmail}
        onChangeUserEmail={handleUserEmailChange}
        members={members}
        isOnline={isOnline}
        isSyncing={isSyncing}
        activePeers={activePeers}
        lastSavedTime={lastSavedTime}
        lastSavedBy={lastSavedBy}
        onManualSaveAndMemorize={handleManualSaveAndMemorize}
        onPullOnlineUpdates={() => handlePullOnlineUpdates(false)}
        onExportBackup={downloadBackupFile}
        totalDocumentsCount={totalDocumentsCount}
        activeTab={activeTab}
        onGoToHome={() => setActiveTab('reports')}
      />

      {/* Navigation Command Bar with Online Status */}
      <Navigation
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        counts={{
          reportsCount: reports.length,
          strugglingCount: strugglingStudents.filter(s => s.progressStatus !== 'Đã hoàn thành mục tiêu').length,
          teamPlansCount: teamDocuments.length,
          examsCount: examsAndPlans.filter(e => e.status === 'Chờ duyệt').length,
          lessonStudiesCount: lessonStudies.length,
          directivesCount: directives.length,
          meetingsCount: meetings.length,
          timetableCount: timetables.length,
          emulationCount: emulations.length + emulationDocuments.length
        }}
        isOnline={isOnline}
        isSyncing={isSyncing}
        activePeers={activePeers}
        onSyncNow={handleManualSaveAndMemorize}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {/* Real-time synchronization indicator banner for the active command bar */}
        <div className="mb-4 bg-emerald-50/95 border border-emerald-300 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5 text-emerald-950 font-medium">
            <span className="flex h-3 w-3 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
            </span>
            <span>
              <strong>Chế độ Online Đám mây đang hoạt động:</strong> Mọi thao tác nộp báo cáo, tải lên hoặc chỉnh sửa tại <span className="font-bold text-emerald-900 underline">{getTabTitle(activeTab)}</span> được tự động truyền phát đồng thời tới tất cả các máy trong Khối 2 &amp; tài khoản chính <strong className="font-mono text-emerald-900">ngoctokhoi2@gmail.com</strong>.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-slate-500 text-[11px] hidden sm:inline">
              Lưu gần nhất: <strong className="text-slate-700">{lastSavedTime || 'Vừa xong'}</strong> ({lastSavedBy || 'Tổ trưởng'})
            </span>
            <button
              type="button"
              onClick={handleManualSaveAndMemorize}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-xs transition-all active:scale-95 disabled:opacity-60"
              title="Bấm để đồng bộ tức thì toàn bộ 9 thanh lệnh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Đồng bộ thanh lệnh này</span>
            </button>
          </div>
        </div>

        {/* Thanh lệnh điều hướng bổ sung: Nút trở lại trang chính khi đang ở bất kỳ tab chức năng nào khác */}
        {activeTab !== 'reports' && (
          <div className="mb-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-xl p-3.5 sm:p-4 shadow-md border border-blue-400/40 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-700/80 rounded-lg border border-blue-300/30 text-amber-300 shadow-inner">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-blue-200 font-bold">
                  Thanh lệnh bổ sung đang mở
                </div>
                <div className="text-sm sm:text-base font-extrabold text-white">
                  {activeTab === 'struggling' && 'Theo dõi HS Chậm tiến bộ & Kế hoạch phụ đạo'}
                  {activeTab === 'team-plans' && 'Kế hoạch Tổ Chuyên môn & PPCT'}
                  {activeTab === 'exams-plans' && 'Kế hoạch Dạy học & Ngân hàng Đề thi Bảo mật'}
                  {activeTab === 'lesson-study' && 'KHBD & Sinh hoạt Chuyên môn Nghiên cứu Bài học'}
                  {activeTab === 'directives' && 'Công văn & Văn bản Chỉ đạo Chuyên môn'}
                  {activeTab === 'meetings' && 'Thông báo Họp & Phòng Họp trực tuyến Zoom'}
                  {activeTab === 'timetable' && 'Thời khóa biểu các Lớp Khối 2'}
                  {activeTab === 'emulation' && 'Hồ sơ & Đánh giá Thi đua Tổ Khối 2'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 text-xs sm:text-sm font-extrabold rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95 border border-amber-200 ring-2 ring-amber-300/50"
                title="Bấm vào đây để trở lại Trang chính của app (Báo cáo HS Hàng tháng)"
              >
                <Home className="w-4 h-4 text-slate-950 shrink-0" />
                <span>Trở lại Trang chính của App</span>
              </button>
            </div>
          </div>
        )}
        {activeTab === 'reports' && (
          <MonthlyReportView
            reports={reports}
            members={members}
            currentUser={currentUser}
            userEmail={userEmail}
            isOnline={isOnline}
            isHostServer={isHostServerDevice(userEmail)}
            onSaveReport={handleSaveReport}
            onDeleteReport={handleDeleteReport}
          />
        )}

        {activeTab === 'struggling' && (
          <StrugglingStudentsView
            students={strugglingStudents}
            members={members}
            currentUser={currentUser}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onRemoveStudent={handleRemoveStudent}
          />
        )}

        {activeTab === 'team-plans' && (
          <TeamDocumentsView
            documents={teamDocuments}
            currentUser={currentUser}
            userEmail={userEmail}
            isHostServer={isHostServerDevice(userEmail)}
            onUploadDocument={handleUploadDocument}
            onDeleteDocument={handleDeleteDocument}
          />
        )}

        {activeTab === 'exams-plans' && (
          <ExamAndLessonPlansView
            items={examsAndPlans}
            members={members}
            currentUser={currentUser}
            userEmail={userEmail}
            isHostServer={isHostServerDevice(userEmail)}
            secretPasswordLeader={secretPasswordLeader}
            onSaveItem={handleSaveExamItem}
            onApproveItem={handleApproveExamItem}
            onDeleteItem={handleDeleteExamItem}
            onUpdatePassword={setSecretPasswordLeader}
          />
        )}

        {activeTab === 'lesson-study' && (
          <LessonStudyView
            topics={lessonStudies}
            members={members}
            currentUser={currentUser}
            onSaveTopic={handleSaveTopic}
            onAddFeedback={handleAddFeedback}
            onDeleteTopic={handleDeleteTopic}
            onDeleteFeedback={handleDeleteFeedback}
          />
        )}

        {/* Separated: Công văn chỉ đạo */}
        {activeTab === 'directives' && (
          <DirectivesView
            directives={directives}
            members={members}
            currentUser={currentUser}
            userEmail={userEmail}
            isHostServer={isHostServerDevice(userEmail)}
            onSaveDirective={handleSaveDirective}
            onDeleteDirective={handleDeleteDirective}
          />
        )}

        {/* Separated: Thông báo họp trực tuyến Zoom */}
        {activeTab === 'meetings' && (
          <MeetingNoticesView
            meetings={meetings}
            members={members}
            currentUser={currentUser}
            userEmail={userEmail}
            isHostServer={isHostServerDevice(userEmail)}
            onSaveMeeting={handleSaveMeeting}
            onDeleteMeeting={handleDeleteMeeting}
          />
        )}

        {/* Thời khóa biểu (TKB) - chỉ hiện khi GV tải lên */}
        {activeTab === 'timetable' && (
          <ClassTimetableView
            timetables={timetables}
            members={members}
            currentUser={currentUser}
            onSaveTimetable={handleSaveTimetable}
            onDeleteTimetable={handleDeleteTimetable}
            onApproveTimetable={handleApproveTimetable}
          />
        )}

        {/* Xét thi đua - hỗ trợ Excel & Word */}
        {activeTab === 'emulation' && (
          <EmulationEvaluationView
            records={emulations}
            emulationDocuments={emulationDocuments}
            members={members}
            currentUser={currentUser}
            userEmail={userEmail}
            isHostServer={isHostServerDevice(userEmail)}
            onSaveRecord={handleSaveEmulation}
            onDeleteRecord={handleDeleteEmulation}
            onSaveEmulationDoc={handleSaveEmulationDoc}
            onDeleteEmulationDoc={handleDeleteEmulationDoc}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-xs text-slate-500 mt-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div>
            <strong>{settings.schoolName}</strong> — {settings.teamName} ({settings.academicYear})
          </div>
          <div className="text-slate-500">
            Hệ thống quản lý chuyên môn Khối 2 • Thư mục KHBD &amp; Ngân hàng đề thi được bảo mật bởi <strong>Tổ trưởng Nguyễn Kim Ngọc</strong>
            {(currentUser.isLeader || currentUser.name.includes('Kim Ngọc')) && (
              <span className="ml-2 text-amber-700 font-semibold font-mono bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                MK TT: {secretPasswordLeader}
              </span>
            )}
          </div>
        </div>
      </footer>

      {/* Modals */}
      <MemberManagementModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        members={members}
        onUpdateMembers={handleUpdateMembers}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onResetToDefault={handleResetToDefault}
      />

      <PromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
      />

      <BackupRestoreModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        onDataRestored={reloadAllDataFromStorage}
        onGoToHome={() => setActiveTab('reports')}
      />
    </div>
  );
}
