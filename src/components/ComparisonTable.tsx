import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3 } from "lucide-react";

interface ComparisonData {
  plan_name: string;
  premium: string;
  coverage: string;
  exclusions: string;
  deductible: string;
}

interface ComparisonTableProps {
  data: ComparisonData[];
}

const ComparisonTable = ({ data }: ComparisonTableProps) => {
  if (!data || data.length === 0) return null;

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-primary" />
        So sánh gói bảo hiểm
      </h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Gói</TableHead>
              <TableHead>Phí BH</TableHead>
              <TableHead>Quyền lợi</TableHead>
              <TableHead>Loại trừ</TableHead>
              <TableHead>Khấu trừ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((plan, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{plan.plan_name}</TableCell>
                <TableCell>{plan.premium}</TableCell>
                <TableCell className="max-w-xs truncate">{plan.coverage}</TableCell>
                <TableCell className="max-w-xs truncate">{plan.exclusions}</TableCell>
                <TableCell>{plan.deductible}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default ComparisonTable;