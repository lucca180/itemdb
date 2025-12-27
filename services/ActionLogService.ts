import { Prisma } from '@prisma/generated/client';
import prisma from '@utils/prisma';

export class LogService {
  static createLog = async (
    actionType: string,
    data: Prisma.ActionLogsCreateInput['logData'],
    subjectId?: string,
    uid?: string
  ) => {
    await prisma.actionLogs.create({
      data: {
        actionType,
        logData: data,
        subject_id: subjectId,
        user_id: uid === 'itemdb_system' ? 'UmY3BzWRSrhZDIlxzFUVxgRXjfi1' : uid,
      },
    });
  };
}
