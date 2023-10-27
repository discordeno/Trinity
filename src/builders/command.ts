import { ApplicationCommandOptionType, MergeArrays, NotAny, Optionalize } from "@type";

type CommandBuilderOption = {
    type: ApplicationCommandOptionType;
    name: string;
    description: string;
    required?: boolean;
    options?: CommandBuilderOption[];
};

type CommandBuilderOptionStripped = {
    required?: boolean;
};

type Choices<T> = T extends number
    ? {
          choices?: <B extends NumberChoiceBuilder<undefined> = NumberChoiceBuilder<undefined>>(choices: B) => NumberChoiceBuilder<any>;
      }
    : T extends string
    ? {
          choices?: <B extends StringChoiceBuilder<undefined> = StringChoiceBuilder<undefined>>(choices: B) => StringChoiceBuilder<any>;
      }
    : never;

export class CommandBuilder<T> {
    private _obj: T;

    constructor(obj?: T) {
        this._obj = obj || ([] as T);
    }

    private push(arg: any) {
        (this._obj as any[]).push(arg);
    }

    attachment<K extends string, O extends CommandBuilderOptionStripped>(name: K, description: string, options?: O) {
        this.push({ type: ApplicationCommandOptionType.Attachment, name: name, description, ...options });

        return new CommandBuilder(this._obj as MergeArrays<T, [{ name: K; description: string; type: ApplicationCommandOptionType.Attachment } & O]>);
    }

    boolean<K extends string, O extends CommandBuilderOptionStripped>(name: K, description: string, options?: O) {
        this.push({ type: ApplicationCommandOptionType.Boolean, name: name, description, ...options });

        return new CommandBuilder(this._obj as MergeArrays<T, [{ name: K; description: string; type: ApplicationCommandOptionType.Boolean } & O]>);
    }

    channel<K extends string, O extends CommandBuilderOptionStripped>(name: K, description: string, options?: O) {
        this.push({ type: ApplicationCommandOptionType.Channel, name: name, description, ...options });

        return new CommandBuilder(this._obj as MergeArrays<T, [{ name: K; description: string; type: ApplicationCommandOptionType.Channel } & O]>);
    }

    integer<K extends string, O extends CommandBuilderOptionStripped & Choices<number>>(name: K, description: string, options?: O) {
        this.push({ type: ApplicationCommandOptionType.Integer, name: name, description, ...options });

        return new CommandBuilder(this._obj as MergeArrays<T, [{ name: K; description: string; type: ApplicationCommandOptionType.Integer } & O]>);
    }

    mentionable<K extends string, O extends CommandBuilderOptionStripped>(name: K, description: string, options?: O) {
        this.push({ type: ApplicationCommandOptionType.Mentionable, name: name, description, ...options });

        return new CommandBuilder(
            this._obj as MergeArrays<T, [{ name: K; description: string; type: ApplicationCommandOptionType.Mentionable } & O]>,
        );
    }

    number<K extends string, O extends CommandBuilderOptionStripped & Choices<number>>(name: K, description: string, options?: O) {
        this.push({ type: ApplicationCommandOptionType.Number, name: name, description, ...options });

        return new CommandBuilder(this._obj as MergeArrays<T, [{ name: K; description: string; type: ApplicationCommandOptionType.Number } & O]>);
    }

    role<K extends string, O extends CommandBuilderOptionStripped>(name: K, description: string, options?: O) {
        this.push({ type: ApplicationCommandOptionType.Role, name: name, description, ...options });

        return new CommandBuilder(this._obj as MergeArrays<T, [{ name: K; description: string; type: ApplicationCommandOptionType.Role } & O]>);
    }

    string<K extends string, O extends CommandBuilderOptionStripped & Choices<string>>(name: K, description: string, options?: O) {
        this.push({ type: ApplicationCommandOptionType.String, name: name, description, ...options });

        return new CommandBuilder(this._obj as MergeArrays<T, [{ name: K; description: string; type: ApplicationCommandOptionType.String } & O]>);
    }

    subcommand<K extends string, C = undefined>(
        name: K,
        description: string,
        builder: (<B extends CommandBuilder<undefined>>(builder: B) => CommandBuilder<C>) | undefined = undefined,
    ) {
        let b = new CommandBuilder<C>();
        // @ts-expect-error - fix this in some time
        if (builder) b = builder(b);

        this.push({ type: ApplicationCommandOptionType.Subcommand, name, description, options: b?.build() });

        return new CommandBuilder(
            this._obj as MergeArrays<
                T,
                [{ name: K; description: string; type: ApplicationCommandOptionType.Subcommand; options: ReturnType<typeof b.build> }]
            >,
        );
    }

    user<K extends string, O extends CommandBuilderOptionStripped>(name: K, description: string, options?: O) {
        this.push({ type: ApplicationCommandOptionType.User, name: name, description, ...options });

        return new CommandBuilder(this._obj as MergeArrays<T, [{ name: K; description: string; type: ApplicationCommandOptionType.User } & O]>);
    }

    build(): T {
        return this._obj;
    }
}

class NumberChoiceBuilder<T> {
    private _obj: T;

    constructor(obj?: T) {
        this._obj = obj || ([] as T);
    }

    private push(arg: any) {
        (this._obj as any[]).push(arg);
    }

    add<K extends string, V extends number>(name: K, value: V) {
        this.push({ name: name, value });

        return new NumberChoiceBuilder(this._obj as MergeArrays<T, [{ name: K; value: V }]>);
    }

    build(): T {
        return this._obj;
    }
}

class StringChoiceBuilder<T> {
    private _obj: T;

    constructor(obj?: T) {
        this._obj = obj || ([] as T);
    }

    private push(arg: any) {
        (this._obj as any[]).push(arg);
    }

    add<K extends string, V extends string>(name: K, value: V) {
        this.push({ name, value });

        return new StringChoiceBuilder(this._obj as MergeArrays<T, [{ name: K; value: V }]>);
    }

    build(): T {
        return this._obj;
    }
}

type OptionTypeMap = {
    [ApplicationCommandOptionType.Attachment]: "attachment";
    [ApplicationCommandOptionType.Boolean]: boolean;
    [ApplicationCommandOptionType.Channel]: "channel";
    [ApplicationCommandOptionType.Integer]: number;
    [ApplicationCommandOptionType.Mentionable]: "mentionable";
    [ApplicationCommandOptionType.Number]: number;
    [ApplicationCommandOptionType.Role]: "role";
    [ApplicationCommandOptionType.String]: string;
    [ApplicationCommandOptionType.User]: "user";
    [ApplicationCommandOptionType.Subcommand]: never;
    [ApplicationCommandOptionType.SubcommandGroup]: never;
};

type ToOptionType<T extends CommandBuilderOption | undefined> = T extends CommandBuilderOption
    ? T extends Choices<number> | Choices<string>
        ? T["choices"] extends (...a: any) => any
            ? NotAny<ReturnType<ReturnType<T["choices"]>["build"]>[number]["value"]> extends never
                ? OptionTypeMap[T["type"]]
                : ReturnType<ReturnType<T["choices"]>["build"]>[number]["value"]
            : undefined
        : T["type"] extends ApplicationCommandOptionType.Subcommand
        ? T["options"] extends CommandBuilderOption[]
            ? Argonize<T["options"]>
            : {}
        : OptionTypeMap[T["type"]]
    : never;

type Argonize<T extends CommandBuilderOption[]> = Optionalize<{
    [K in T[number]["name"]]: Extract<T[number], { name: K }> extends { required: true }
        ? ToOptionType<Extract<T[number], { name: K }>>
        : ToOptionType<Extract<T[number], { name: K }>> | undefined;
}>;
