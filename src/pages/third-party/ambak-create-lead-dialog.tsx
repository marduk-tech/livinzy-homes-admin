import { Alert, Button, Col, DatePicker, Form, Input, InputNumber, message, Modal, Radio, Row, Select, Tabs } from "antd";
import type { Dayjs } from "dayjs";
import { useState } from "react";
import { useAmbakMasterdata, useCreateAmbakLead } from "../../hooks/third-party-hooks";
import type { AmbakLeadRequest, AmbakMasterOption } from "../../libs/api/ambak";
import { errorMessage } from "../../libs/api-error";
import {
  amountInput,
  compact,
  MASTERDATA_ERROR_TITLE,
  masterOptions,
  sectionOfFirstError,
} from "./ambak-form-helpers";

type Customer = AmbakLeadRequest["customer"];
type LeadDetails = NonNullable<AmbakLeadRequest["lead_details"]>;
type BtInfo = NonNullable<AmbakLeadRequest["lead_bt_info"]>;

// Flat across the dialog's tabs; buildLead nests it into leadParams.
export type LeadFormValues = Omit<Customer, "dob"> &
  LeadDetails &
  Omit<BtInfo, "previous_loan_date"> & {
    loan_type: number;
    loan_sub_type?: number;
    dob?: Dayjs;
    previous_loan_date?: Dayjs;
  };

const BALANCE_TRANSFER = 1;

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];
const PROPERTY_IDENTIFIED = [
  { value: "1", label: "Yes" },
  { value: "0", label: "No" },
];

const SECTION_FIELDS: Record<string, string[]> = {
  customer: [
    "loan_type",
    "loan_sub_type",
    "first_name",
    "last_name",
    "mobile",
    "email",
    "dob",
    "gender",
    "pancard_no",
    "aadhar_no",
    "cra_city",
    "cra_pincode",
  ],
  loan: [
    "loan_amount",
    "tenure",
    "profession",
    "annual_income",
    "company_name",
    "company_type",
    "salary_credit_mode",
    "existing_emi",
    "cibil_score",
    "existing_bank_id",
  ],
  property: [
    "is_property_identified",
    "property_pincode",
    "property_type",
    "property_value",
    "usage_type",
    "agreement_type",
  ],
  bt: [
    "previous_loan_amount",
    "previous_outstanding_amount",
    "previous_existing_emi",
    "previous_tenure",
    "previous_loan_date",
    "previous_roi",
    "loan_topup_required_amount",
  ],
};

const lettersOnly = { pattern: /^[A-Za-z]+$/, message: "Letters only" };
const sixDigits = { pattern: /^\d{6}$/, message: "6 digits" };

const buildLead = (v: LeadFormValues): AmbakLeadRequest => {
  const leadDetails = compact<LeadDetails>({
    loan_amount: v.loan_amount,
    tenure: v.tenure,
    profession: v.profession,
    annual_income: v.annual_income,
    company_name: v.company_name,
    company_type: v.company_type,
    salary_credit_mode: v.salary_credit_mode,
    existing_emi: v.existing_emi,
    cibil_score: v.cibil_score,
    existing_bank_id: v.existing_bank_id,
    is_property_identified: v.is_property_identified,
    property_pincode: v.property_pincode,
    property_type: v.property_type,
    property_value: v.property_value,
    usage_type: v.usage_type,
    agreement_type: v.agreement_type,
  });
  const btInfo = compact<BtInfo>({
    previous_loan_amount: v.previous_loan_amount,
    previous_outstanding_amount: v.previous_outstanding_amount,
    previous_existing_emi: v.previous_existing_emi,
    previous_tenure: v.previous_tenure,
    previous_loan_date: v.previous_loan_date?.toISOString(),
    previous_roi: v.previous_roi,
    loan_topup_required_amount: v.loan_topup_required_amount,
  });
  return compact<AmbakLeadRequest>({
    loan_type: v.loan_type,
    loan_sub_type: v.loan_sub_type,
    customer: compact<Customer>({
      first_name: v.first_name.trim(),
      last_name: v.last_name.trim(),
      mobile: v.mobile.trim(),
      email: v.email.trim(),
      dob: v.dob?.format("YYYY-MM-DD"), // create_lead takes YYYY-MM-DD, unlike offers
      gender: v.gender,
      pancard_no: v.pancard_no?.trim().toUpperCase(),
      aadhar_no: v.aadhar_no?.trim(),
      cra_city: v.cra_city,
      cra_pincode: v.cra_pincode?.trim(),
    }),
    lead_details: Object.keys(leadDetails).length > 0 ? leadDetails : undefined,
    lead_bt_info: v.loan_sub_type === BALANCE_TRANSFER && Object.keys(btInfo).length > 0 ? btInfo : undefined,
  });
};

// initialValues prefill the form each time it opens (the modal is destroyed on close); all stay editable.
export function CreateLeadDialog({
  open,
  onClose,
  initialValues,
}: {
  open: boolean;
  onClose: () => void;
  initialValues?: Partial<LeadFormValues>;
}) {
  const [form] = Form.useForm<LeadFormValues>();
  const [section, setSection] = useState("customer");
  const {
    data: masterdata,
    isLoading: masterLoading,
    isFetching: masterFetching,
    error: masterError,
    refetch: refetchMasterdata,
  } = useAmbakMasterdata();
  const createLead = useCreateAmbakLead();

  const loanSubType = Form.useWatch("loan_sub_type", form);
  const isBalanceTransfer = loanSubType === BALANCE_TRANSFER;

  const select = (list: AmbakMasterOption[] | undefined, placeholder?: string) => (
    <Select allowClear loading={masterLoading} options={masterOptions(list)} placeholder={placeholder} />
  );

  const close = () => {
    createLead.reset();
    setSection("customer");
    onClose();
  };

  const onFinish = (values: LeadFormValues) =>
    createLead.mutate(buildLead(values), {
      onSuccess: (result) => {
        if (result.id && !result.is_duplicate) {
          // The lead exists in Ambak either way; a failed user save is only a warning.
          if (result.userError) {
            message.warning(
              `Ambak lead #${result.id} created, but it couldn't be saved on the user: ${result.userError}`,
              8,
            );
          } else {
            message.success(
              `Ambak lead #${result.id} created and saved on ${result.user?.created ? "a new" : "the existing"} user`,
            );
          }
          close();
        }
      },
    });

  const onFinishFailed = ({ errorFields }: { errorFields: { name: (string | number)[] }[] }) => {
    const target = sectionOfFirstError(SECTION_FIELDS, errorFields);
    if (target) setSection(target);
  };

  const result = createLead.data;

  const sections = [
    {
      key: "customer",
      label: "Customer",
      children: (
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="loan_type" label="Loan type" rules={[{ required: true }]}>
              <Select
                loading={masterLoading}
                options={masterOptions(masterdata?.loan_type)}
                placeholder="Select loan type"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="loan_sub_type" label="Loan sub type" tooltip="Leave empty for a fresh loan">
              {select(masterdata?.loan_sub_type, "Fresh loan")}
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="first_name" label="First name" rules={[{ required: true }, lettersOnly]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="last_name" label="Last name" rules={[{ required: true }, lettersOnly]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="mobile"
              label="Mobile"
              rules={[
                { required: true },
                {
                  pattern: /^\d{10}$/,
                  message: "Exactly 10 digits, no +91 or 0",
                },
              ]}
            >
              <Input maxLength={10} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="email" label="Email" rules={[{ required: true }, { type: "email" }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="dob" label="Date of birth">
              <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="gender" label="Gender">
              <Select allowClear options={GENDERS} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="pancard_no"
              label="PAN"
              rules={[
                {
                  pattern: /^[A-Za-z]{5}\d{4}[A-Za-z]$/,
                  message: "Invalid PAN",
                },
              ]}
            >
              <Input maxLength={10} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="aadhar_no" label="Aadhaar" rules={[{ pattern: /^\d{12}$/, message: "12 digits" }]}>
              <Input maxLength={12} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="cra_city" label="Residence city ID" tooltip="Ambak city ID (master list pending)">
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="cra_pincode" label="Residence pincode" rules={[sixDigits]}>
              <Input maxLength={6} />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      key: "loan",
      label: "Loan & Income",
      children: (
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="loan_amount" label="Loan amount">
              {amountInput}
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="tenure" label="Tenure (years)">
              <InputNumber min={1} max={40} precision={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="profession" label="Profession">
              {select(masterdata?.profession)}
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="annual_income" label="Annual income">
              {amountInput}
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="company_name" label="Company name">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="company_type" label="Company type">
              {select(masterdata?.company_type)}
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="salary_credit_mode" label="Salary credit mode">
              {select(masterdata?.salary_credit_mode)}
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="existing_emi" label="Existing EMI" tooltip="Current total monthly EMI">
              {amountInput}
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="cibil_score" label="CIBIL score">
              <InputNumber min={300} max={900} precision={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="existing_bank_id" label="Existing bank ID" tooltip="Ambak bank ID (master list pending)">
              <InputNumber min={1} precision={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      key: "property",
      label: "Property",
      children: (
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="is_property_identified" label="Property identified?">
              <Radio.Group options={PROPERTY_IDENTIFIED} optionType="button" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="property_pincode" label="Property pincode" rules={[sixDigits]}>
              <Input maxLength={6} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="property_value" label="Property value">
              {amountInput}
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="property_type" label="Property type">
              {select(masterdata?.property_type)}
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="usage_type" label="Usage type">
              {select(masterdata?.usage_type)}
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="agreement_type" label="Agreement type">
              {select(masterdata?.agreement_type)}
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    ...(isBalanceTransfer
      ? [
          {
            key: "bt",
            label: "Balance Transfer",
            children: (
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="previous_loan_amount" label="Previous loan amount">
                    {amountInput}
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="previous_outstanding_amount" label="Outstanding amount">
                    {amountInput}
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="previous_existing_emi" label="Current EMI">
                    {amountInput}
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="previous_tenure" label="Previous tenure (years)">
                    <InputNumber min={1} max={40} precision={0} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="previous_loan_date" label="Loan start date">
                    <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="previous_roi" label="Current ROI (%)">
                    <InputNumber min={0} max={30} step={0.05} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="loan_topup_required_amount" label="Top-up required">
                    {amountInput}
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
        ]
      : []),
  ].map((s) => ({ ...s, forceRender: true })); // keep every tab mounted so all fields validate on submit

  return (
    <Modal
      title="Create Ambak Lead"
      open={open}
      width={760}
      okText="Create Lead"
      onOk={form.submit}
      onCancel={close}
      confirmLoading={createLead.isPending}
      okButtonProps={{ disabled: !masterdata }}
      destroyOnClose
    >
      {masterError && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message={MASTERDATA_ERROR_TITLE}
          description={errorMessage(masterError, "Unknown error")}
          action={
            <Button size="small" loading={masterFetching} onClick={() => refetchMasterdata()}>
              Retry
            </Button>
          }
        />
      )}
      {createLead.error && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Failed to create lead"
          description={errorMessage(createLead.error, "Unknown error")}
        />
      )}
      {result?.is_duplicate && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Lead already exists in Ambak"
          description={result.message ?? "This customer already has a lead; it wasn't created again."}
        />
      )}
      {result && !result.id && !result.is_duplicate && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Ambak didn't create the lead"
          description={result.message ?? "No reason given"}
        />
      )}
      <Form
        form={form}
        layout="vertical"
        preserve={false}
        initialValues={initialValues}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
      >
        {/* the BT tab goes away when the sub type changes, so fall back to the first tab */}
        <Tabs
          activeKey={section === "bt" && !isBalanceTransfer ? "customer" : section}
          onChange={setSection}
          items={sections}
        />
      </Form>
    </Modal>
  );
}
