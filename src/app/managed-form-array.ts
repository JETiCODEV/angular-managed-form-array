import { AbstractControl, FormArray } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';

export declare type RawValue<T extends AbstractControl | undefined> =
  T extends AbstractControl<any, any>
    ? T['setValue'] extends (v: infer R) => void
      ? R
      : never
    : never;

export abstract class ManagedFormArray<
  T extends AbstractControl<any, any>
> extends FormArray<T> {
  private readonly subscriptionMap = new Map<AbstractControl, Subscription>();
  private readonly destroy: Subject<void>;
  private readonly _groupChange = new Subject<{ form: T; index: number }>();

  public readonly groupChanges = this._groupChange.asObservable();

  protected constructor(
    destroy: Subject<void>,
    initialData?: ReadonlyArray<RawValue<T>>
  ) {
    super([]);
    this.setupInitialData(initialData);
    this.destroy = destroy;

    const subscription = this.destroy.subscribe(() => {
      this.subscriptionMap.forEach((x) => x.unsubscribe());
      subscription.unsubscribe();
    });
  }

  public addItem(data: RawValue<T>) {
    const form = this.createForm(data);
    this.push(form);

    const index = this.controls.indexOf(form);
    const subscription = this.subscribe?.(form, index);
    if (subscription) {
      this.subscriptionMap.set(form, subscription);
    }
  }

  public removeItem(data: T) {
    const subscription = this.subscriptionMap.get(data);
    subscription?.unsubscribe();
    this.subscriptionMap.delete(data);
    const index = this.controls.indexOf(data);
    this.removeAt(index);
  }

  abstract createForm(data: RawValue<T>): T;

  private setupInitialData(initialData?: ReadonlyArray<RawValue<T>>) {
    initialData?.forEach((x) => this.addItem(x));
  }

  private subscribe(form: T, index: number): Subscription {
    return form.valueChanges.subscribe(() => {
      this._groupChange.next({ form, index });
    });
  }
}
