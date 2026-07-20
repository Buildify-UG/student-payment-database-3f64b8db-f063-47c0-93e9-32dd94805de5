
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Trash2, Edit } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Student {
  id: string;
  code: string;
  name: string;
  grade: number;
  phone_number: string;
}

interface Payment {
  id: string;
  student_id: string;
  month: string;
  amount: number;
}

interface MonthlySummary {
  month: string;
  total: number;
}

const MONTHS = [
  'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 
  'ديسمبر', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو'
];

const GRADES = [2, 3, 4, 5, 6];

const Index = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchName, setSearchName] = useState('');
  const [searchGrade, setSearchGrade] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({ name: '', grade: '', code: '', phone_number: '' });

  useEffect(() => {
    loadStudents();
    loadPayments();
  }, []);

  useEffect(() => {
    calculateMonthlySummary();
  }, [payments]);

  const loadStudents = async () => {
    const { data, error } = await supabase.from('students').select('*');
    if (error) {
      toast.error('خطأ في تحميل البيانات');
    } else {
      setStudents(data || []);
    }
  };

  const loadPayments = async () => {
    const { data, error } = await supabase.from('payments').select('*');
    if (error) {
      toast.error('خطأ في تحميل الدفعات');
    } else {
      setPayments(data || []);
    }
  };

  const calculateMonthlySummary = () => {
    const summary: { [key: string]: number } = {};
    payments.forEach(payment => {
      summary[payment.month] = (summary[payment.month] || 0) + payment.amount;
    });
    setMonthlySummary(
      MONTHS.map(month => ({ month, total: summary[month] || 0 }))
    );
  };

  const handleAddStudent = async () => {
    if (!formData.name || !formData.grade || !formData.code || !formData.phone_number) {
      toast.error('الرجاء ملء جميع الحقول');
      return;
    }

    if (editingStudent) {
      const { error } = await supabase
        .from('students')
        .update(formData)
        .eq('id', editingStudent.id);
      if (error) {
        toast.error('خطأ في تحديث الطالب');
      } else {
        toast.success('تم تحديث الطالب بنجاح');
        loadStudents();
      }
    } else {
      const { error } = await supabase.from('students').insert([formData]);
      if (error) {
        toast.error('خطأ في إضافة الطالب');
      } else {
        toast.success('تم إضافة الطالب بنجاح');
        loadStudents();
      }
    }

    setFormData({ name: '', grade: '', code: '', phone_number: '' });
    setEditingStudent(null);
    setIsOpen(false);
  };

  const handleDeleteStudent = async (id: string) => {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) {
      toast.error('خطأ في حذف الطالب');
    } else {
      toast.success('تم حذف الطالب بنجاح');
      loadStudents();
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      grade: student.grade.toString(),
      code: student.code,
      phone_number: student.phone_number,
    });
    setIsOpen(true);
  };

  const filteredStudents = students.filter(student => {
    const matchName = student.name.includes(searchName);
    const matchGrade = !searchGrade || student.grade.toString() === searchGrade;
    const matchCode = student.code.includes(searchCode);
    return matchName && matchGrade && matchCode;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">إدارة الطلاب</h1>
          <p className="text-gray-600">نظام إدارة الطلاب والدفعات المالية</p>
        </div>

        {/* Add Student Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="mb-6 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 ml-2" />
              إضافة طالب جديد
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>{editingStudent ? 'تعديل الطالب' : 'إضافة طالب جديد'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="الاسم"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Input
                placeholder="الكود"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
              <Select value={formData.grade} onValueChange={(value) => setFormData({ ...formData, grade: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الصف" />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map(grade => (
                    <SelectItem key={grade} value={grade.toString()}>
                      الصف {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="رقم الهاتف"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              />
              <Button onClick={handleAddStudent} className="w-full bg-blue-600 hover:bg-blue-700">
                {editingStudent ? 'تحديث' : 'إضافة'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="البحث بالاسم"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={searchGrade} onValueChange={setSearchGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="البحث بالصف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الصفوف</SelectItem>
                  {GRADES.map(grade => (
                    <SelectItem key={grade} value={grade.toString()}>
                      الصف {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="البحث بالكود"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Students Table */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>الطلاب ({filteredStudents.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الكود</TableHead>
                        <TableHead className="text-right">الاسم</TableHead>
                        <TableHead className="text-right">الصف</TableHead>
                        <TableHead className="text-right">الهاتف</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map(student => (
                        <TableRow key={student.id}>
                          <TableCell>{student.code}</TableCell>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>الصف {student.grade}</TableCell>
                          <TableCell>{student.phone_number}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditStudent(student)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteStudent(student.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>ملخص الشهور</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {monthlySummary.map(item => (
                    <div key={item.month} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{item.month}</span>
                      <span className="text-sm font-bold text-blue-600">{item.total.toFixed(2)} ر.س</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 flex justify-between items-center font-bold">
                    <span>الإجمالي</span>
                    <span className="text-green-600">
                      {monthlySummary.reduce((sum, item) => sum + item.total, 0).toFixed(2)} ر.س
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
