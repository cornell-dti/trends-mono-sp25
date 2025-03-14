type Instructor = {
  firstName: string;
  lastName: string;
  netid?: string;
};

type Course = {
  subject: string;
  catalogNbr: number;
  titleShort: string;
  description?: string;
  credits?: number;
  whenOffered?: string;
  instructors?: Instructor[];
  showDetails?: boolean;
};
