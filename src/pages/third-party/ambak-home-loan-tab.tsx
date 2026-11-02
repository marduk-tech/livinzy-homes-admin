import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Collapse,
  DatePicker,
  Descriptions,
  Empty,
  Flex,
  Form,
  InputNumber,
  Radio,
  Row,
  Select,
  Skeleton,
  Statistic,
  Tabs,
  Tag,
  Timeline,
  Typography,
  theme,
  type FormInstance,
} from "antd";
import type { Dayjs } from "dayjs";
import { useRef, useState } from "react";
import { useAmbakMasterdata, useAmbakOffers } from "../../hooks/third-party-hooks";
import type { AmbakMasterdata, AmbakMasterOption, AmbakOffer, AmbakOffersRequest } from "../../libs/api/ambak";
import { errorMessage } from "../../libs/api-error";
import { CreateLeadDialog, type LeadFormValues } from "./ambak-create-lead-dialog";
import {
  amountInput,
  compact,
  formatINR,
  MASTERDATA_ERROR_TITLE,
  masterOptions,
  sectionOfFirstError,
  YES_NO,
} from "./ambak-form-helpers";
import { AmbakLeadStatusTab } from "./ambak-lead-status-tab";

type YesNo = "Yes" | "No";
type LeadDetails = AmbakOffersRequest["lead_details"];
type PropertyDetails = AmbakOffersRequest["property_details"];
type CoApplicant = NonNullable<AmbakOffersRequest["co_applicant"]>[number];

// The form is flat across its tabs; buildPayload nests it into the request.
// property_city is sent as property_city (HL) or Property_city (LAP).
type FormValues = Omit<LeadDetails, "Fullfilment_type"> &
  Omit<NonNullable<PropertyDetails>, "Property_city"> &
  Partial<CoApplicant> & { loan_type: number; dob: Dayjs };

const HOME_LOAN = 1;
const LAP = 2;

const toOptions = (values: string[]) => values.map((v) => ({ value: v, label: v.replace(/_/g, " ") }));

// Offers takes these as strings, not master-data IDs (see Step 2 of the guide).
const HL_PROPERTY_TYPES = toOptions(["Resale", "Builder_endorsement", "Builder_allotment", "Authority_allotment"]);
const HL_PROPERTY_SUB_TYPES = toOptions(["Ready_to_move", "Plot", "Plot_construction", "Construction_linked"]);
const HL_AGREEMENT_TYPES = toOptions(["Freehold", "Leasehold", "Regularised"]);
const LAP_PROPERTY_SUB_TYPES = toOptions(["plot", "ready to move"]);
const LAP_PROPERTY_USAGES = toOptions(["residential", "commercial", "industrial"]);
const LAP_OCCUPANCY_STATUSES = toOptions(["Self_occupied", "vacant", "Given_on_rent"]);
const PAYMENT_MODES = toOptions(["cash", "account"]);

// Which form tab each field lives on, so a failed submit can jump to the first error.
const SECTION_FIELDS: Record<string, string[]> = {
  lead: [
    "loan_type",
    "profession",
    "loan_amount",
    "cibil_score",
    "max_tenure",
    "monthly_salary",
    "gross_monthly_salary",
    "dob",
    "existing_emi_amount",
    "emi_ending_six_month",
    "is_property_decided",
  ],
  property: [
    "expected_market_value",
    "property_city",
    "property_type",
    "property_sub_type",
    "agreement_type",
    "property_usage",
    "occupancy_status",
  ],
  income: [
    "is_additional_income",
    "rent_amount",
    "monthly_incentives_amount",
    "annual_bonus_amount",
    "monthly_reimbursements_amount",
    "payment_mode",
  ],
  coApplicant: ["is_co_additional_income", "ca_profession", "ca_gross_monthly_salary"],
};

const buildPayload = (v: FormValues): AmbakOffersRequest => {
  const isLap = v.loan_type === LAP;
  const property = compact<NonNullable<PropertyDetails>>({
    expected_market_value: v.expected_market_value,
    [isLap ? "Property_city" : "property_city"]: v.property_city,
    property_type: v.property_type,
    property_sub_type: v.property_sub_type,
    agreement_type: v.agreement_type,
    property_usage: v.property_usage,
    occupancy_status: v.occupancy_status,
  });
  return {
    loan_type: isLap ? "2" : "1",
    lead_details: compact<LeadDetails>({
      loan_amount: v.loan_amount,
      cibil_score: v.cibil_score,
      max_tenure: v.max_tenure,
      monthly_salary: v.monthly_salary,
      gross_monthly_salary: v.gross_monthly_salary,
      profession: v.profession,
      Fullfilment_type: "Self",
      existing_emi_amount: v.existing_emi_amount,
      emi_ending_six_month: v.emi_ending_six_month,
      is_property_decided: v.is_property_decided,
      is_additional_income: v.is_additional_income,
      rent_amount: v.rent_amount,
      monthly_incentives_amount: v.monthly_incentives_amount,
      annual_bonus_amount: v.annual_bonus_amount,
      monthly_reimbursements_amount: v.monthly_reimbursements_amount,
      payment_mode: v.payment_mode,
    }),
    ...(Object.keys(property).length > 0 && { property_details: property }),
    ...(v.is_co_additional_income === "Yes" && {
      co_applicant: [
        compact<CoApplicant>({
          is_co_additional_income: "Yes",
          ca_profession: v.ca_profession,
          ca_gross_monthly_salary: v.ca_gross_monthly_salary,
        }),
      ],
    }),
    customer: { dob: v.dob.format("DD/MM/YYYY") },
  };
};

// Offers takes property fields as strings; create_lead takes master ids. These
// are the master labels for the offers values whose names don't match exactly.
const HL_PROPERTY_TYPE_LABELS: Record<string, string> = {
  Builder_endorsement: "Builder Endorsement",
  Builder_allotment: "Builder Direct Allotment",
  Authority_allotment: "Authority Direct Allotment",
};

const masterIdByLabel = (list: AmbakMasterOption[] | undefined, label?: string) => {
  const id = label && list?.find((o) => o.label.toLowerCase() === label.toLowerCase())?.id;
  return id ? Number(id) : undefined;
};

// Carries what's been entered in Enter Requirements (submitted or not) into the
// create lead form; fields with no lead equivalent (city, sub type...) are skipped.
const toLeadPrefill = (v: Partial<FormValues>, masterdata?: AmbakMasterdata): Partial<LeadFormValues> =>
  compact<Partial<LeadFormValues>>({
    loan_type: v.loan_type,
    dob: v.dob,
    loan_amount: v.loan_amount,
    tenure: v.max_tenure,
    profession: v.profession,
    annual_income: v.gross_monthly_salary !== undefined ? v.gross_monthly_salary * 12 : undefined,
    existing_emi: v.existing_emi_amount,
    cibil_score: v.cibil_score,
    is_property_identified: v.is_property_decided === "Yes" ? "1" : v.is_property_decided === "No" ? "0" : undefined,
    property_value: v.expected_market_value,
    property_type: masterIdByLabel(
      masterdata?.property_type,
      v.property_type && (HL_PROPERTY_TYPE_LABELS[v.property_type] ?? v.property_type),
    ),
    usage_type: masterIdByLabel(masterdata?.usage_type, v.property_usage),
    agreement_type: masterIdByLabel(masterdata?.agreement_type, v.agreement_type),
  });

function StepDot({ n, active }: { n: number; active: boolean }) {
  const { token } = theme.useToken();
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 24,
        height: 24,
        borderRadius: "50%",
        fontSize: 12,
        fontWeight: 600,
        border: `1px solid ${active ? token.colorPrimary : token.colorBorder}`,
        background: active ? token.colorPrimary : token.colorBgContainer,
        color: active ? token.colorTextLightSolid : token.colorTextSecondary,
      }}
    >
      {n}
    </span>
  );
}

// The form instance comes from the tab, which reads it to prefill the create lead dialog.
function RequirementsForm({
  form,
  onSubmit,
  submitting,
}: {
  form: FormInstance<FormValues>;
  onSubmit: (p: AmbakOffersRequest) => void;
  submitting: boolean;
}) {
  const [section, setSection] = useState("lead");
  const {
    data: masterdata,
    isLoading: masterLoading,
    isFetching: masterFetching,
    error: masterError,
    refetch: refetchMasterdata,
  } = useAmbakMasterdata();

  const loanType = Form.useWatch("loan_type", form);
  const propertyDecided = Form.useWatch("is_property_decided", form) as YesNo | undefined;
  const additionalIncome = Form.useWatch("is_additional_income", form) as YesNo | undefined;
  const coApplicantIncome = Form.useWatch("is_co_additional_income", form) as YesNo | undefined;

  const loanTypeOptions = masterOptions(masterdata?.loan_type);
  const professionOptions = masterOptions(masterdata?.profession);

  const onFinishFailed = ({ errorFields }: { errorFields: { name: (string | number)[] }[] }) => {
    const target = sectionOfFirstError(SECTION_FIELDS, errorFields);
    if (target) setSection(target);
  };

  const sections = [
    {
      key: "lead",
      label: "Lead Details",
      children: (
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item name="loan_type" label="Loan type" rules={[{ required: true }]}>
              <Select loading={masterLoading} options={loanTypeOptions} placeholder="Select loan type" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="profession" label="Profession" rules={[{ required: true }]}>
              <Select loading={masterLoading} options={professionOptions} placeholder="Select profession" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="loan_amount" label="Loan amount" rules={[{ required: true }]}>
              {amountInput}
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="max_tenure" label="Tenure (years)" rules={[{ required: true }]}>
              <InputNumber min={1} max={40} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="cibil_score" label="CIBIL score" rules={[{ required: true }]}>
              <InputNumber min={300} max={900} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="monthly_salary" label="Net monthly salary" rules={[{ required: true }]}>
              {amountInput}
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="gross_monthly_salary" label="Gross monthly salary" rules={[{ required: true }]}>
              {amountInput}
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="dob" label="Date of birth" rules={[{ required: true }]}>
              <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="existing_emi_amount" label="Existing EMI" tooltip="Current monthly EMI obligations">
              {amountInput}
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="emi_ending_six_month"
              label="EMI ending in 6 months"
              tooltip="EMI obligations ending within 6 months"
            >
              {amountInput}
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="is_property_decided" label="Property decided?">
              <Radio.Group options={YES_NO} optionType="button" />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      key: "property",
      label: "Property",
      children: !loanType ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Select a loan type in Lead Details first" />
      ) : (
        <Row gutter={16} key={loanType}>
          {loanType === HOME_LOAN && (
            <Col xs={24} md={8}>
              <Form.Item
                name="expected_market_value"
                label="Expected market value"
                rules={[{ required: propertyDecided === "Yes", message: "Required when the property is decided" }]}
              >
                {amountInput}
              </Form.Item>
            </Col>
          )}
          <Col xs={24} md={8}>
            <Form.Item name="property_city" label="Property city ID" tooltip="Ambak city ID (master list pending)">
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          {loanType === HOME_LOAN ? (
            <>
              <Col xs={24} md={8}>
                <Form.Item name="property_type" label="Property type">
                  <Select allowClear options={HL_PROPERTY_TYPES} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="property_sub_type" label="Property sub type">
                  <Select allowClear options={HL_PROPERTY_SUB_TYPES} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="agreement_type" label="Agreement type">
                  <Select allowClear options={HL_AGREEMENT_TYPES} />
                </Form.Item>
              </Col>
            </>
          ) : (
            <>
              <Col xs={24} md={8}>
                <Form.Item name="property_sub_type" label="Property sub type">
                  <Select allowClear options={LAP_PROPERTY_SUB_TYPES} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="property_usage" label="Property usage" rules={[{ required: true }]}>
                  <Select allowClear options={LAP_PROPERTY_USAGES} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="occupancy_status" label="Occupancy status">
                  <Select allowClear options={LAP_OCCUPANCY_STATUSES} />
                </Form.Item>
              </Col>
            </>
          )}
        </Row>
      ),
    },
    {
      key: "income",
      label: "Additional Income",
      children: (
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="is_additional_income" label="Include additional income?">
              <Radio.Group options={YES_NO} optionType="button" />
            </Form.Item>
          </Col>
          {additionalIncome === "Yes" && (
            <>
              <Col xs={24} md={8}>
                <Form.Item name="rent_amount" label="Monthly rent income">
                  {amountInput}
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="monthly_incentives_amount" label="Monthly incentives">
                  {amountInput}
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="annual_bonus_amount" label="Annual bonus">
                  {amountInput}
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="monthly_reimbursements_amount" label="Monthly reimbursements">
                  {amountInput}
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="payment_mode" label="Payment mode">
                  <Select allowClear options={PAYMENT_MODES} />
                </Form.Item>
              </Col>
            </>
          )}
        </Row>
      ),
    },
    {
      key: "coApplicant",
      label: "Co-Applicant",
      children: (
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="is_co_additional_income" label="Include co-applicant income?">
              <Radio.Group options={YES_NO} optionType="button" />
            </Form.Item>
          </Col>
          {coApplicantIncome === "Yes" && (
            <>
              <Col xs={24} md={8}>
                <Form.Item name="ca_profession" label="Co-applicant profession">
                  <Select allowClear loading={masterLoading} options={professionOptions} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="ca_gross_monthly_salary" label="Co-applicant gross monthly salary">
                  {amountInput}
                </Form.Item>
              </Col>
            </>
          )}
        </Row>
      ),
    },
  ].map((s) => ({ ...s, forceRender: true })); // keep every tab mounted so all fields validate on submit

  return (
    <Card>
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
      <Form
        form={form}
        layout="vertical"
        preserve={false}
        initialValues={{ is_property_decided: "No", is_additional_income: "No", is_co_additional_income: "No" }}
        onFinish={(values) => onSubmit(buildPayload(values))}
        onFinishFailed={onFinishFailed}
      >
        <Tabs activeKey={section} onChange={setSection} items={sections} />
        <Flex justify="flex-end">
          <Button type="primary" htmlType="submit" loading={submitting} disabled={!masterdata}>
            Submit
          </Button>
        </Flex>
      </Form>
    </Card>
  );
}

function OfferCard({ offer }: { offer: AmbakOffer }) {
  const roi =
    offer.minRoi === undefined
      ? "-"
      : offer.maxRoi !== undefined && offer.maxRoi !== offer.minRoi
        ? `${offer.minRoi}% – ${offer.maxRoi}%`
        : `${offer.minRoi}%`;
  const tenure = offer.finalMaxTenure ?? offer.maxTenure;
  const concessions = offer.roiConcessions?.appliedConcessions ?? [];

  const fees: [string, number | string | undefined][] = [
    ["Processing fee", offer.processingFee],
    ["Processing (additional)", offer.processingText],
    ["Login fee", offer.login_fee],
    ["A/c handling", offer.ac_handling_charge],
    ["Legal & technical", offer.legal_technical_fee],
    ["E-stamp", offer.e_stamp_charge],
    ["Due diligence", offer.due_diligence_charge],
    ["CERSAI", offer.CERSAI_charge],
    ["MODT", offer.MODT_charge],
    ["NOI", offer.NOI_charge],
    ["Foreclosure", offer.foreclosure_charge],
  ];
  const presentFees = fees.filter(([, v]) => v !== undefined && v !== null && v !== "");

  return (
    <Card style={{ height: "100%" }}>
      <Flex align="center" gap={12} style={{ marginBottom: 12 }}>
        <Avatar shape="square" size={40} src={offer.bankLogo}>
          {offer.bankName?.[0]}
        </Avatar>
        <Typography.Text strong style={{ fontSize: 16 }}>
          {offer.bankName}
        </Typography.Text>
      </Flex>
      <Row gutter={[12, 12]}>
        <Col span={12}>
          <Statistic title="ROI" value={roi} valueStyle={{ fontSize: 20 }} />
        </Col>
        <Col span={12}>
          <Statistic title="Monthly EMI" value={formatINR(offer.monthlyEMI)} valueStyle={{ fontSize: 20 }} />
        </Col>
        <Col span={12}>
          <Statistic title="Eligible amount" value={formatINR(offer.eligibalLoanAmount)} valueStyle={{ fontSize: 16 }} />
        </Col>
        <Col span={12}>
          <Statistic
            title="Tenure"
            value={tenure === undefined ? "-" : `${tenure} yrs`}
            valueStyle={{ fontSize: 16 }}
          />
        </Col>
      </Row>
      <Flex wrap gap={4} style={{ marginTop: 12 }}>
        {offer.calculationBase && <Tag color="blue">{offer.calculationBase}</Tag>}
        {offer.is_apf_approved && <Tag color="green">APF approved</Tag>}
        {concessions.map((c) => (
          <Tag key={c.key} color="gold">
            {c.label}: −{c.concession}% ROI
          </Tag>
        ))}
      </Flex>
      {offer.uspData?.map((u) => (
        <Typography.Paragraph key={u.usp_text} type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
          {u.usp_text.trim()}
        </Typography.Paragraph>
      ))}
      {presentFees.length > 0 && (
        <Collapse
          ghost
          size="small"
          style={{ marginTop: 8, marginInline: -12 }}
          items={[
            {
              key: "fees",
              label: "Fees & charges",
              children: (
                <Descriptions column={1} size="small">
                  {presentFees.map(([label, value]) => (
                    <Descriptions.Item key={label} label={label}>
                      {formatINR(value)}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              ),
            },
          ]}
        />
      )}
    </Card>
  );
}

function Offers({ mutation }: { mutation: ReturnType<typeof useAmbakOffers> }) {
  if (mutation.isPending)
    return (
      <Row gutter={[16, 16]}>
        {[0, 1, 2].map((i) => (
          <Col key={i} xs={24} md={12} xl={8}>
            <Card>
              <Skeleton active avatar />
            </Card>
          </Col>
        ))}
      </Row>
    );
  if (mutation.error)
    return (
      <Alert
        type="error"
        showIcon
        message="Failed to fetch offers"
        description={errorMessage(mutation.error, "Unknown error")}
      />
    );
  if (!mutation.data)
    return (
      <Card>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Submit your requirements to see bank offers" />
      </Card>
    );
  if (mutation.data.length === 0)
    return (
      <Card>
        <Empty description="No eligible bank offers for these requirements" />
      </Card>
    );

  const offers = [...mutation.data].sort((a, b) => (a.minRoi ?? Infinity) - (b.minRoi ?? Infinity));
  return (
    <>
      <Typography.Text type="secondary">
        {offers.length} eligible {offers.length === 1 ? "bank" : "banks"}, lowest ROI first
      </Typography.Text>
      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        {offers.map((offer, i) => (
          <Col key={`${offer.bankId ?? offer.bankName}-${i}`} xs={24} md={12} xl={8}>
            <OfferCard offer={offer} />
          </Col>
        ))}
      </Row>
    </>
  );
}

function OffersAndLead() {
  const offersMutation = useAmbakOffers();
  const offersRef = useRef<HTMLDivElement>(null);
  const hasOffers = !!offersMutation.data;
  const [requirementsForm] = Form.useForm<FormValues>();
  const { data: masterdata } = useAmbakMasterdata();
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [leadPrefill, setLeadPrefill] = useState<Partial<LeadFormValues>>();

  const openLeadDialog = () => {
    setLeadPrefill(toLeadPrefill(requirementsForm.getFieldsValue(true), masterdata));
    setLeadDialogOpen(true);
  };

  const submit = (payload: AmbakOffersRequest) => {
    offersMutation.mutate(payload, {
      onSettled: () => offersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    });
  };

  return (
    <>
      <Flex justify="flex-end" style={{ paddingTop: 8, marginBottom: 16 }}>
        <Button type="primary" onClick={openLeadDialog}>
          Create Lead
        </Button>
      </Flex>
      <CreateLeadDialog
        open={leadDialogOpen}
        onClose={() => setLeadDialogOpen(false)}
        initialValues={leadPrefill}
      />
      <Timeline
        style={{ paddingTop: 8 }}
        items={[
          {
            dot: <StepDot n={1} active />,
            children: (
              <>
                <Typography.Title level={5} style={{ marginTop: 0 }}>
                  Enter Requirements
                </Typography.Title>
                <RequirementsForm
                  form={requirementsForm}
                  onSubmit={submit}
                  submitting={offersMutation.isPending}
                />
              </>
            ),
          },
          {
            dot: <StepDot n={2} active={hasOffers || offersMutation.isPending} />,
            children: (
              <div ref={offersRef}>
                <Typography.Title level={5} style={{ marginTop: 0 }}>
                  See Offers
                </Typography.Title>
                <Offers mutation={offersMutation} />
              </div>
            ),
          },
        ]}
      />
    </>
  );
}

// Tabs keep a visited pane mounted, so switching to Track Lead and back keeps
// the entered requirements and offers.
export function AmbakHomeLoanTab() {
  return (
    <Tabs
      items={[
        { key: "offers", label: "Offers & Lead", children: <OffersAndLead /> },
        { key: "track", label: "Track Lead", children: <AmbakLeadStatusTab /> },
      ]}
    />
  );
}
