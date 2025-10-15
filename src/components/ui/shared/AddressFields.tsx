import { Input } from "~/components/ui/shared/Input";

interface AddressFieldsProps {
	prefix?: string;
	values: {
		firstName: string;
		lastName: string;
		email: string;
		phone: string;
		streetAddress: string;
		city: string;
		state: string;
		country: string;
		zipCode: string;
	};
	onChange: (name: string, value: string) => void;
	required?: boolean;
}

export function AddressFields({
	prefix = "",
	values,
	onChange,
	required = true,
}: AddressFieldsProps) {
	const getFieldName = (name: string) => (prefix ? `${prefix}${name}` : name);

	return (
		<>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
				<Input
					label="First Name"
					id={getFieldName("firstName")}
					name={getFieldName("firstName")}
					value={values.firstName}
					onChange={(e) => onChange(getFieldName("firstName"), e.target.value)}
					required={required}
				/>

				<Input
					label="Last Name"
					id={getFieldName("lastName")}
					name={getFieldName("lastName")}
					value={values.lastName}
					onChange={(e) => onChange(getFieldName("lastName"), e.target.value)}
					required={required}
				/>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
				<Input
					label="Email"
					id={getFieldName("email")}
					name={getFieldName("email")}
					type="email"
					value={values.email}
					onChange={(e) => onChange(getFieldName("email"), e.target.value)}
					required={required}
				/>

				<Input
					label="Phone"
					id={getFieldName("phone")}
					name={getFieldName("phone")}
					type="tel"
					value={values.phone}
					onChange={(e) => onChange(getFieldName("phone"), e.target.value)}
					required={required}
				/>
			</div>

			<Input
				className="mb-6"
				label="Address"
				id={getFieldName("streetAddress")}
				name={getFieldName("streetAddress")}
				value={values.streetAddress}
				onChange={(e) =>
					onChange(getFieldName("streetAddress"), e.target.value)
				}
				required={required}
			/>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
				<Input
					label="State"
					id={getFieldName("state")}
					name={getFieldName("state")}
					value={values.state}
					onChange={(e) => onChange(getFieldName("state"), e.target.value)}
				/>

				<Input
					label="City"
					id={getFieldName("city")}
					name={getFieldName("city")}
					value={values.city}
					onChange={(e) => onChange(getFieldName("city"), e.target.value)}
					required={required}
				/>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
				<Input
					label="Country"
					id={getFieldName("country")}
					name={getFieldName("country")}
					value={values.country}
					onChange={(e) => onChange(getFieldName("country"), e.target.value)}
					required={required}
				/>

				<Input
					label="ZIP code"
					id={getFieldName("zipCode")}
					name={getFieldName("zipCode")}
					value={values.zipCode}
					onChange={(e) => onChange(getFieldName("zipCode"), e.target.value)}
					required={required}
				/>
			</div>
		</>
	);
}
