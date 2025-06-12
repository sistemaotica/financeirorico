
-- Primeiro, vamos verificar e corrigir a função de baixa de contas para garantir sincronização adequada
DROP FUNCTION IF EXISTS public.atualizar_saldo_baixa_conta() CASCADE;

CREATE OR REPLACE FUNCTION public.atualizar_saldo_baixa_conta()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Para contas de fornecedor (pagar): diminui do saldo do banco
    -- Para contas de cliente (receber): soma ao saldo do banco
    DECLARE
        conta_record RECORD;
    BEGIN
        SELECT destino_tipo INTO conta_record FROM public.contas WHERE id = NEW.conta_id;
        
        IF conta_record.destino_tipo = 'fornecedor' THEN
            -- Conta a pagar: diminui saldo
            UPDATE public.bancos SET saldo = saldo - NEW.valor WHERE id = NEW.banco_id;
        ELSE
            -- Conta a receber: aumenta saldo
            UPDATE public.bancos SET saldo = saldo + NEW.valor WHERE id = NEW.banco_id;
        END IF;
    END;
    
    -- Atualizar valor baixa na conta
    UPDATE public.contas 
    SET valor_baixa = valor_baixa + NEW.valor,
        status = CASE 
          WHEN valor_baixa + NEW.valor >= valor THEN 'pago' 
          ELSE 'aberto' 
        END
    WHERE id = NEW.conta_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Reverter operação
    DECLARE
        conta_record RECORD;
    BEGIN
        SELECT destino_tipo INTO conta_record FROM public.contas WHERE id = OLD.conta_id;
        
        IF conta_record.destino_tipo = 'fornecedor' THEN
            -- Desfazer baixa de fornecedor: adiciona de volta ao saldo
            UPDATE public.bancos SET saldo = saldo + OLD.valor WHERE id = OLD.banco_id;
        ELSE
            -- Desfazer baixa de cliente: subtrai do saldo
            UPDATE public.bancos SET saldo = saldo - OLD.valor WHERE id = OLD.banco_id;
        END IF;
    END;
    
    -- Atualizar valor baixa na conta
    UPDATE public.contas 
    SET valor_baixa = valor_baixa - OLD.valor,
        status = CASE 
          WHEN valor_baixa - OLD.valor >= valor THEN 'pago' 
          ELSE 'aberto' 
        END
    WHERE id = OLD.conta_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Recriar o trigger
DROP TRIGGER IF EXISTS trigger_atualizar_saldo_baixa_conta ON public.baixas_contas;
CREATE TRIGGER trigger_atualizar_saldo_baixa_conta
  AFTER INSERT OR DELETE ON public.baixas_contas
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_saldo_baixa_conta();

-- Habilitar realtime para bancos para sincronização automática
ALTER TABLE public.bancos REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bancos;

-- Habilitar realtime para baixas_contas também
ALTER TABLE public.baixas_contas REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.baixas_contas;
